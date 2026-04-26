import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AnalyticsService } from '../../../services/analytics.service';
import { CurrencyService } from '../../../services/currency.service';

interface KpiCard {
  labelKey: string;
  value: string;
  icon: string;
  color: string;
  glowColor: string;
}

interface QuickAction {
  labelKey: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  currency = inject(CurrencyService);

  loading = signal(true);
  kpiCards = signal<KpiCard[]>([]);
  rawData = signal<Record<string, unknown> | null>(null);

  quickActions: QuickAction[] = [
    { labelKey: 'ADMIN.NAV.USERS',      icon: 'group',             route: '/app/admin/users',      color: 'bg-primary/10 text-primary' },
    { labelKey: 'ADMIN.NAV.STORES',     icon: 'storefront',        route: '/app/admin/stores',     color: 'bg-secondary/10 text-secondary' },
    { labelKey: 'ADMIN.NAV.CATEGORIES', icon: 'category',          route: '/app/admin/categories', color: 'bg-tertiary/10 text-tertiary' },
    { labelKey: 'ADMIN.NAV.AUDIT_LOGS', icon: 'manage_history',    route: '/app/admin/audit-logs', color: 'bg-error/10 text-error' },
  ];

  ngOnInit() {
    this.analyticsService.getAdminAnalytics().subscribe({
      next: (data) => {
        this.rawData.set(data);
        this.kpiCards.set([
          { labelKey: 'ANALYTICS.KPI_USERS',        value: String(data.totalUsers  ?? 0),                icon: 'group',        color: 'bg-primary/10 text-primary',   glowColor: 'bg-primary/10' },
          { labelKey: 'ANALYTICS.KPI_STORES',       value: String(data.totalStores ?? 0),                icon: 'storefront',   color: 'bg-secondary/10 text-secondary', glowColor: 'bg-secondary/10' },
          { labelKey: 'ANALYTICS.KPI_TOTAL_ORDERS', value: String(data.totalOrders ?? 0),                icon: 'receipt_long', color: 'bg-tertiary/10 text-tertiary',  glowColor: 'bg-tertiary/10' },
          { labelKey: 'ANALYTICS.KPI_TOTAL_REVENUE',value: this.currency.format(data.totalRevenue ?? 0), icon: 'payments',     color: 'bg-primary/10 text-primary',   glowColor: 'bg-primary/10' },
        ]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
