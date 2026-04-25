import { Component, inject, OnInit, OnDestroy, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollRowComponent } from '../../components/scroll-row/scroll-row';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { CurrencyService } from '../../services/currency.service';
import { HttpClient } from '@angular/common/http';
import { switchMap, forkJoin, Observable } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../enviroments/enviroments';

interface KpiCard {
  labelKey: string;
  value: string;
  icon: string;
  trendKey?: string;
}

type DatePreset = '7d' | '30d' | '90d' | '1y' | 'lifetime';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollRowComponent, TranslateModule],
  templateUrl: './analytics.html',
})
export class AnalyticsPageComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private analyticsService = inject(AnalyticsService);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  currency = inject(CurrencyService);

  role = this.auth.currentUser()?.role;
  loading = signal(true);
  kpiCards = signal<KpiCard[]>([]);
  rawData = signal<Record<string, unknown> | null>(null);
  prevData = signal<Record<string, unknown> | null>(null);
  activeStoreId = signal<number | null>(null);
  stores = signal<{ id: number; name: string }[]>([]);

  // Corporate date range
  datePreset = signal<DatePreset>('30d');

  // Individual order chart data
  orderStatusCounts = signal<Record<string, number>>({});
  monthlySpend = signal<{ month: string; total: number }[]>([]);
  showOrderCharts = signal(false);

  private charts: any[] = [];

  readonly presets: { key: DatePreset; label: string }[] = [
    { key: '7d',       label: '7 Days' },
    { key: '30d',      label: '30 Days' },
    { key: '90d',      label: '90 Days' },
    { key: '1y',       label: '1 Year' },
    { key: 'lifetime', label: 'Lifetime' },
  ];

  ngOnInit() {
    if (this.role === 'INDIVIDUAL') {
      this.loadIndividual();
    } else if (this.role === 'CORPORATE') {
      this.loadCorporate();
    } else if (this.role === 'ADMIN') {
      this.loadAdmin();
    } else {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  private destroyCharts() {
    this.charts.forEach(c => { try { c.destroy(); } catch (_) {} });
    this.charts = [];
  }

  private getDateRange(preset: DatePreset): { from: string | null; to: string } {
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    if (preset === 'lifetime') return { from: null, to };

    const from = new Date(now);
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : preset === '90d' ? 90 : 365;
    from.setDate(now.getDate() - days);
    return { from: from.toISOString().split('T')[0], to };
  }

  private getPrevDateRange(preset: DatePreset): { from: string | null; to: string | null } {
    if (preset === 'lifetime') return { from: null, to: null };
    const now = new Date();
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : preset === '90d' ? 90 : 365;
    const to = new Date(now);
    to.setDate(now.getDate() - days);
    const from = new Date(to);
    from.setDate(to.getDate() - days);
    return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
  }

  setPreset(preset: DatePreset) {
    this.datePreset.set(preset);
    this.reloadCorporate();
  }

  switchStore(id: number) {
    this.activeStoreId.set(id);
    this.reloadCorporate();
  }

  private reloadCorporate() {
    const id = this.activeStoreId();
    if (!id) return;
    this.loading.set(true);
    this.destroyCharts();
    const { from, to } = this.getDateRange(this.datePreset());
    const prev = this.getPrevDateRange(this.datePreset());

    const requests: Record<string, Observable<any>> = {
      current: this.analyticsService.getCorporateAnalytics(id, from ?? undefined, to)
    };
    if (prev.from && prev.to) {
      requests['previous'] = this.analyticsService.getCorporateAnalytics(id, prev.from, prev.to);
    }

    forkJoin(requests).subscribe({
      next: (res: any) => {
        const current = res.current;
        const previous = res.previous || null;
        this.rawData.set(current);
        this.prevData.set(previous);
        this.buildCorporateKpis(current);
        this.loading.set(false);
        this.initChartsAsync('corporate', current, previous);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadIndividual() {
    forkJoin({
      analytics: this.analyticsService.getIndividualAnalytics(),
      orders: this.http.get<any[]>(`${environment.apiUrl}/orders/my`),
    }).subscribe({
      next: ({ analytics, orders }) => {
        this.rawData.set(analytics);
        this.buildIndividualKpis(analytics);
        // Build chart data from orders
        const statusCounts: Record<string, number> = {};
        const monthlyMap: Record<string, { total: number; date: Date }> = {};
        orders.forEach((o: any) => {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
          const d = new Date(o.createdAt);
          const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          if (!monthlyMap[key]) monthlyMap[key] = { total: 0, date: d };
          monthlyMap[key].total += (o.totalPrice || 0);
        });
        this.orderStatusCounts.set(statusCounts);
        const sorted = Object.entries(monthlyMap)
          .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime())
          .slice(-6)
          .map(([month, v]) => ({ month, total: v.total }));
        this.monthlySpend.set(sorted);
        this.showOrderCharts.set(orders.length > 0);
        this.loading.set(false);
        this.initChartsAsync('individual', analytics, null);
      },
      error: () => {
        // Fallback: analytics only, no order charts
        this.analyticsService.getIndividualAnalytics().subscribe({
          next: (data) => {
            this.rawData.set(data);
            this.buildIndividualKpis(data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
    });
  }

  private buildIndividualKpis(data: any) {
    this.kpiCards.set([
      { labelKey: 'ANALYTICS.KPI_TOTAL_ORDERS',     value: String(data.totalOrders),                  icon: 'receipt_long' },
      { labelKey: 'ANALYTICS.DATA_TOTAL_SPEND',     value: this.currency.format(data.totalSpend),     icon: 'payments' },
      { labelKey: 'ANALYTICS.DATA_AVG_ORDER_VALUE', value: this.currency.format(data.avgOrderValue),  icon: 'trending_up' },
      { labelKey: 'ANALYTICS.DATA_TOTAL_REVIEWS',   value: String(data.totalReviews),                 icon: 'star' },
    ]);
  }

  private loadCorporate() {
    const { from, to } = this.getDateRange('30d');
    const prev = this.getPrevDateRange('30d');
    this.analyticsService.getMyStores().pipe(
      switchMap((stores) => {
        this.stores.set(stores);
        const id = stores[0]?.id;
        if (id) this.activeStoreId.set(id);
        
        const requests: Record<string, Observable<any>> = {
          current: this.analyticsService.getCorporateAnalytics(id, from ?? undefined, to)
        };
        if (prev.from && prev.to) {
          requests['previous'] = this.analyticsService.getCorporateAnalytics(id, prev.from, prev.to);
        }
        return forkJoin(requests);
      })
    ).subscribe({
      next: (res: any) => {
        const current = res.current;
        const previous = res.previous || null;
        this.rawData.set(current);
        this.prevData.set(previous);
        this.buildCorporateKpis(current);
        this.loading.set(false);
        this.initChartsAsync('corporate', current, previous);
      },
      error: () => this.loading.set(false),
    });
  }

  private buildCorporateKpis(data: any) {
    this.kpiCards.set([
      { labelKey: 'ANALYTICS.KPI_TOTAL_REVENUE',  value: this.currency.format(data.totalRevenue),  icon: 'payments',     trendKey: 'totalRevenue' },
      { labelKey: 'ANALYTICS.KPI_TOTAL_ORDERS',   value: String(data.totalOrders),                 icon: 'receipt_long', trendKey: 'totalOrders' },
      { labelKey: 'ANALYTICS.KPI_TOTAL_PRODUCTS', value: String(data.totalProducts),               icon: 'inventory_2',  trendKey: 'totalProducts' },
      { labelKey: 'ANALYTICS.KPI_AVG_RATING',     value: Number(data.avgReviewRating).toFixed(1),  icon: 'star',         trendKey: 'avgReviewRating' },
    ]);
  }

  private loadAdmin() {
    this.analyticsService.getAdminAnalytics().subscribe({
      next: (data) => {
        this.rawData.set(data);
        this.kpiCards.set([
          { labelKey: 'ANALYTICS.KPI_USERS',         value: String(data.totalUsers),                 icon: 'group' },
          { labelKey: 'ANALYTICS.KPI_STORES',        value: String(data.totalStores),                icon: 'storefront' },
          { labelKey: 'ANALYTICS.KPI_TOTAL_ORDERS',  value: String(data.totalOrders),                icon: 'receipt_long' },
          { labelKey: 'ANALYTICS.KPI_TOTAL_REVENUE', value: this.currency.format(data.totalRevenue), icon: 'payments' },
        ]);
        this.loading.set(false);
        this.initChartsAsync('admin', data, null);
      },
      error: () => this.loading.set(false),
    });
  }

  getTrend(key: string): string {
    const curr = this.rawData();
    const prev = this.prevData();
    if (!curr || !prev) return '';
    const c = Number(curr[key] ?? 0);
    const p = Number(prev[key] ?? 0);
    if (p === 0) return c > 0 ? '+100%' : '';
    const diff = ((c - p) / p) * 100;
    return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
  }

  ratingStars(): number {
    if (this.role !== 'CORPORATE') return 0;
    return Math.round(Number(this.kpiCards()[3]?.value ?? 0));
  }

  avgRatingLabel(): string {
    if (this.role !== 'CORPORATE') return '—';
    return this.kpiCards()[3]?.value ?? '—';
  }

  roleLabel(): string {
    if (this.role === 'INDIVIDUAL') return 'ANALYTICS.ROLE_INDIVIDUAL';
    if (this.role === 'CORPORATE') return 'ANALYTICS.ROLE_CORPORATE';
    if (this.role === 'ADMIN') return 'ANALYTICS.ROLE_ADMIN';
    return 'ANALYTICS.TITLE';
  }

  dataEntries(): { key: string; value: unknown }[] {
    const data = this.rawData();
    if (!data) return [];
    const labelMap: Record<string, string> = {
      totalOrders:     'ANALYTICS.DATA_TOTAL_ORDERS',
      totalSpend:      'ANALYTICS.DATA_TOTAL_SPEND',
      avgOrderValue:   'ANALYTICS.DATA_AVG_ORDER_VALUE',
      totalReviews:    'ANALYTICS.DATA_TOTAL_REVIEWS',
      totalRevenue:    'ANALYTICS.DATA_TOTAL_REVENUE',
      totalProducts:   'ANALYTICS.DATA_TOTAL_PRODUCTS',
      avgReviewRating: 'ANALYTICS.DATA_AVG_REVIEW_RATING',
      totalUsers:      'ANALYTICS.DATA_TOTAL_USERS',
      totalStores:     'ANALYTICS.DATA_TOTAL_STORES',
    };
    return Object.entries(data).map(([key, value]) => ({
      key: labelMap[key] ?? key,
      value,
    }));
  }

  formatValue(value: unknown): string {
    if (typeof value === 'number') {
      if (value > 100) return this.currency.format(value);
      return String(value);
    }
    return String(value ?? '—');
  }

  private async initChartsAsync(
    type: 'individual' | 'corporate' | 'admin',
    data: any,
    prevData: any | null,
  ) {
    if (!isPlatformBrowser(this.platformId)) return;
    await new Promise(r => setTimeout(r, 150));
    this.destroyCharts();
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    const textColor = '#6b7280';
    const gridColor = 'rgba(107,114,128,0.12)';

    if (type === 'individual') {
      this.initIndividualCharts(Chart, textColor, gridColor);
    } else if (type === 'corporate') {
      this.initCorporateCharts(Chart, data, prevData, textColor, gridColor);
    } else if (type === 'admin') {
      this.initAdminCharts(Chart, data, textColor, gridColor);
    }
  }

  private initIndividualCharts(Chart: any, textColor: string, gridColor: string) {
    // Order Status Doughnut
    const statusCanvas = document.getElementById('chart-status') as HTMLCanvasElement;
    if (statusCanvas) {
      const statusCounts = this.orderStatusCounts();
      const entries = Object.entries(statusCounts);
      if (entries.length > 0) {
        const statusColors: Record<string, string> = {
          PENDING:    '#fbbf24',
          CONFIRMED:  '#60a5fa',
          PROCESSING: '#a78bfa',
          SHIPPED:    '#818cf8',
          DELIVERED:  '#34d399',
          CANCELLED:  '#f87171',
        };
        const labels = entries.map(([s]) => s);
        const values = entries.map(([, v]) => v);
        const colors = labels.map(l => statusColors[l] ?? '#94a3b8');
        this.charts.push(new Chart(statusCanvas, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { color: textColor, font: { size: 11 }, padding: 10 } },
            },
            cutout: '68%',
          },
        }));
      }
    }

    // Monthly Spend Bar
    const spendCanvas = document.getElementById('chart-spend') as HTMLCanvasElement;
    if (spendCanvas) {
      const monthly = this.monthlySpend();
      if (monthly.length > 0) {
        this.charts.push(new Chart(spendCanvas, {
          type: 'bar',
          data: {
            labels: monthly.map(m => m.month),
            datasets: [{
              label: 'Spend',
              data: monthly.map(m => m.total),
              backgroundColor: 'rgba(167,139,250,0.5)',
              borderColor: '#a78bfa',
              borderWidth: 2,
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
              y: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { size: 10 }, callback: (v: any) => '$' + v },
              },
            },
          },
        }));
      }
    }
  }

  private initCorporateCharts(Chart: any, curr: any, prev: any, textColor: string, gridColor: string) {
    const compCanvas = document.getElementById('chart-comparison') as HTMLCanvasElement;
    if (compCanvas) {
      const hasPrevData = prev && (Number(prev.totalRevenue) > 0 || Number(prev.totalOrders) > 0);
      if (hasPrevData) {
        // % change vs previous period
        const calc = (c: number, p: number) => p > 0 ? +((c - p) / p * 100).toFixed(1) : 0;
        const changes = [
          calc(curr.totalRevenue, prev.totalRevenue),
          calc(curr.totalOrders, prev.totalOrders),
          calc(curr.totalProducts, prev.totalProducts),
          calc(curr.avgReviewRating, prev.avgReviewRating),
        ];
        const bgColors = changes.map(v => v >= 0 ? 'rgba(52,211,153,0.6)' : 'rgba(248,113,113,0.6)');
        const borderColors = changes.map(v => v >= 0 ? '#34d399' : '#f87171');
        this.charts.push(new Chart(compCanvas, {
          type: 'bar',
          data: {
            labels: ['Revenue', 'Orders', 'Products', 'Rating'],
            datasets: [{
              label: '% vs Previous Period',
              data: changes,
              backgroundColor: bgColors,
              borderColor: borderColors,
              borderWidth: 2,
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: textColor } },
              y: {
                grid: { color: gridColor },
                ticks: { color: textColor, callback: (v: any) => v + '%' },
              },
            },
          },
        }));
      } else {
        // No prev data — show absolute values
        const presetLabel = this.datePreset() === '7d' ? '7d' : this.datePreset() === '30d' ? '30d'
          : this.datePreset() === '90d' ? '90d' : this.datePreset() === '1y' ? '1y' : 'Lifetime';
        this.charts.push(new Chart(compCanvas, {
          type: 'bar',
          data: {
            labels: ['Orders', 'Products'],
            datasets: [{
              label: `Current (${presetLabel})`,
              data: [curr.totalOrders, curr.totalProducts],
              backgroundColor: ['rgba(96,165,250,0.6)', 'rgba(52,211,153,0.6)'],
              borderColor: ['#60a5fa', '#34d399'],
              borderWidth: 2,
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: textColor } },
              y: { grid: { color: gridColor }, ticks: { color: textColor } },
            },
          },
        }));
      }
    }

    // Rating Doughnut
    const ratingCanvas = document.getElementById('chart-rating') as HTMLCanvasElement;
    if (ratingCanvas) {
      const rating = Math.max(0, Math.min(5, Number(curr.avgReviewRating) || 0));
      this.charts.push(new Chart(ratingCanvas, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [rating, 5 - rating],
            backgroundColor: ['#fbbf24', 'rgba(148,163,184,0.15)'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          cutout: '78%',
        },
      }));
    }
  }

  private initAdminCharts(Chart: any, data: any, textColor: string, gridColor: string) {
    // Platform Overview Horizontal Bar
    const platformCanvas = document.getElementById('chart-platform') as HTMLCanvasElement;
    if (platformCanvas) {
      this.charts.push(new Chart(platformCanvas, {
        type: 'bar',
        data: {
          labels: ['Users', 'Stores', 'Orders'],
          datasets: [{
            data: [data.totalUsers, data.totalStores, data.totalOrders],
            backgroundColor: ['rgba(96,165,250,0.6)', 'rgba(167,139,250,0.6)', 'rgba(52,211,153,0.6)'],
            borderColor: ['#60a5fa', '#a78bfa', '#34d399'],
            borderWidth: 2,
            borderRadius: 6,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { display: false }, ticks: { color: textColor } },
          },
        },
      }));
    }

    // Users vs Stores Doughnut
    const usersCanvas = document.getElementById('chart-users-stores') as HTMLCanvasElement;
    if (usersCanvas) {
      this.charts.push(new Chart(usersCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Users', 'Stores'],
          datasets: [{
            data: [data.totalUsers, data.totalStores],
            backgroundColor: ['rgba(96,165,250,0.7)', 'rgba(167,139,250,0.7)'],
            borderWidth: 0,
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: textColor, font: { size: 11 }, padding: 10 } },
          },
          cutout: '65%',
        },
      }));
    }
  }
}
