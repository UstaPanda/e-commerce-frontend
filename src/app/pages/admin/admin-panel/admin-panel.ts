import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CurrencyService } from '../../../services/currency.service';
import {
  AdminService, AdminUser, AdminStore, AdminOrder, AdminProduct, AdminCoupon,
  PageResponse
} from '../../../services/admin.service';
import { environment } from '../../../../enviroments/enviroments';

type Tab = 'analytics' | 'ai-support' | 'stores' | 'orders' | 'products' | 'users';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.html',
})
export class AdminPanelComponent implements OnInit {
  private adminService = inject(AdminService);
  private http = inject(HttpClient);
  currency = inject(CurrencyService);

  activeTab = signal<Tab>('analytics');

  // ── Analytics ───────────────────��──────────────────────────────────────
  analyticsLoading = signal(true);
  analytics = signal<any>(null);

  // ── Users ─────────────────────────────────────────────────���────────────
  usersLoading = signal(false);
  users = signal<AdminUser[]>([]);
  usersTotal = signal(0);
  usersPages = signal(0);
  usersPage = signal(0);
  usersSearch = '';
  userActionLoading = signal<number | null>(null);
  userConfirm = signal<{ user: AdminUser; action: 'suspend' | 'unsuspend' | 'delete' } | null>(null);

  // ── Stores ─────────────────────────────────────────────────────────────
  storesLoading = signal(false);
  stores = signal<AdminStore[]>([]);
  storesTotal = signal(0);
  storesPages = signal(0);
  storesPage = signal(0);
  storesSearch = '';
  storeActionLoading = signal<number | null>(null);
  storeConfirm = signal<{ store: AdminStore; action: 'open' | 'close' | 'pending' } | null>(null);

  // Coupons
  couponsLoading = signal(false);
  coupons = signal<AdminCoupon[]>([]);
  couponsTotal = signal(0);
  couponsPages = signal(0);
  couponsPage = signal(0);
  showCouponModal = signal(false);
  couponForm: any = {};
  couponSaving = signal(false);
  couponError = signal('');
  couponActionLoading = signal<number | null>(null);
  selectedStoreForCoupon = signal<AdminStore | null>(null);

  // ── Orders ─────────────────────────────────────────────────────────────
  ordersLoading = signal(false);
  orders = signal<AdminOrder[]>([]);
  ordersTotal = signal(0);
  ordersPages = signal(0);
  ordersPage = signal(0);
  ordersStatusFilter = '';
  orderActionLoading = signal<number | null>(null);
  expandedOrderId = signal<number | null>(null);

  readonly orderStatuses = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURNED'];
  readonly orderStatusLabels: Record<string, string> = {
    PENDING: 'Bekliyor', CONFIRMED: 'Onaylandı', PROCESSING: 'İşlemde',
    SHIPPED: 'Kargoda', DELIVERED: 'Teslim Edildi', CANCELLED: 'İptal', RETURNED: 'İade',
  };

  // ── Products ───────────────────────────────────────────────────────────
  productsLoading = signal(false);
  products = signal<AdminProduct[]>([]);
  productsTotal = signal(0);
  productsPages = signal(0);
  productsPage = signal(0);
  productsSearch = '';

  // ── AI Support ─────────────────────────────────────────────────────────
  aiMessages = signal<{
    role: 'user' | 'assistant';
    text: string;
    sqlQuery?: string;
    visualizationData?: any;
    timestamp: Date;
  }[]>([]);
  aiInput = '';
  aiLoading = signal(false);
  aiError = signal('');
  private renderedCharts = new Set<number>();

  ngOnInit() {
    this.loadAnalytics();
  }

  selectTab(tab: Tab) {
    this.activeTab.set(tab);
    if (tab === 'users' && this.users().length === 0) this.loadUsers();
    if (tab === 'stores' && this.stores().length === 0) { this.loadStores(); this.loadCoupons(); }
    if (tab === 'orders' && this.orders().length === 0) this.loadOrders();
    if (tab === 'products' && this.products().length === 0) this.loadProducts();
  }

  // ── Analytics ─────────────────���─────────────────────────��──────────────
  loadAnalytics() {
    this.analyticsLoading.set(true);
    this.adminService.getAnalytics().subscribe({
      next: d => { this.analytics.set(d); this.analyticsLoading.set(false); },
      error: () => this.analyticsLoading.set(false),
    });
  }

  // ── Users ──────────────────────────────────────────────────────��───────
  loadUsers(page = 0) {
    this.usersLoading.set(true);
    this.adminService.getUsers(page, 20, this.usersSearch).subscribe({
      next: r => {
        this.users.set(r.content); this.usersTotal.set(r.totalElements);
        this.usersPages.set(r.totalPages); this.usersPage.set(r.number);
        this.usersLoading.set(false);
      },
      error: () => this.usersLoading.set(false),
    });
  }

  openUserConfirm(user: AdminUser, action: 'suspend' | 'unsuspend' | 'delete') {
    this.userConfirm.set({ user, action });
  }

  confirmUserAction() {
    const m = this.userConfirm();
    if (!m) return;
    this.userActionLoading.set(m.user.id);
    this.userConfirm.set(null);
    if (m.action === 'delete') {
      this.adminService.deleteUser(m.user.id).subscribe({
        next: () => { this.users.update(l => l.filter(u => u.id !== m.user.id)); this.userActionLoading.set(null); },
        error: () => this.userActionLoading.set(null),
      });
    } else {
      const obs = m.action === 'suspend'
        ? this.adminService.suspendUser(m.user.id)
        : this.adminService.unsuspendUser(m.user.id);
      obs.subscribe({
        next: (updated: AdminUser) => { this.users.update(l => l.map(u => u.id === updated.id ? updated : u)); this.userActionLoading.set(null); },
        error: () => this.userActionLoading.set(null),
      });
    }
  }

  isSuspended(user: AdminUser): boolean {
    return user.status === 'SUSPENDED';
  }

  userRoleBadge(role: string): string {
    if (role === 'ADMIN') return 'bg-error/10 text-error';
    if (role === 'CORPORATE') return 'bg-primary/10 text-primary';
    return 'bg-surface-container-high text-on-surface-variant';
  }

  userStatusBadge(status: string): string {
    if (status === 'ACTIVE') return 'bg-secondary/10 text-secondary';
    if (status === 'SUSPENDED') return 'bg-error/10 text-error';
    return 'bg-surface-container-high text-on-surface-variant';
  }

  // ── Stores ───────────────────────────────────────────────────────────��─
  loadStores(page = 0) {
    this.storesLoading.set(true);
    this.adminService.getAllStores(page, 20, this.storesSearch).subscribe({
      next: r => {
        this.stores.set(r.content); this.storesTotal.set(r.totalElements);
        this.storesPages.set(r.totalPages); this.storesPage.set(r.number);
        this.storesLoading.set(false);
      },
      error: () => this.storesLoading.set(false),
    });
  }

  openStoreConfirm(store: AdminStore, action: 'open' | 'close' | 'pending') {
    this.storeConfirm.set({ store, action });
  }

  confirmStoreAction() {
    const m = this.storeConfirm();
    if (!m) return;
    this.storeActionLoading.set(m.store.id);
    this.storeConfirm.set(null);
    const statusMap: Record<string, string> = { open: 'OPEN', close: 'CLOSED', pending: 'PENDING' };
    this.adminService.updateStoreStatus(m.store.id, statusMap[m.action]).subscribe({
      next: (updated: AdminStore) => { this.stores.update(l => l.map(s => s.id === updated.id ? updated : s)); this.storeActionLoading.set(null); },
      error: () => this.storeActionLoading.set(null),
    });
  }

  storeStatusBadge(status: string): string {
    if (status === 'OPEN') return 'bg-secondary/10 text-secondary';
    if (status === 'CLOSED') return 'bg-error/10 text-error';
    return 'bg-tertiary/10 text-tertiary';
  }

  // ── Coupons ────────────────────────────────────���────────────────────────
  loadCoupons(page = 0) {
    this.couponsLoading.set(true);
    this.adminService.getCoupons(page, 20).subscribe({
      next: r => {
        this.coupons.set(r.content); this.couponsTotal.set(r.totalElements);
        this.couponsPages.set(r.totalPages); this.couponsPage.set(r.number);
        this.couponsLoading.set(false);
      },
      error: () => this.couponsLoading.set(false),
    });
  }

  openCouponModal(store?: AdminStore) {
    this.couponForm = { code: '', discountType: 'PERCENTAGE', discountValue: 10, maxUses: null, expiresAt: '', storeId: store?.id ?? null };
    this.selectedStoreForCoupon.set(store ?? null);
    this.couponError.set('');
    this.showCouponModal.set(true);
  }

  closeCouponModal() {
    this.showCouponModal.set(false);
    this.couponSaving.set(false);
    this.couponError.set('');
  }

  saveCoupon() {
    if (!this.couponForm.code?.trim()) return;
    this.couponSaving.set(true);
    this.couponError.set('');
    const body: any = {
      code: this.couponForm.code.trim(),
      discountType: this.couponForm.discountType,
      discountValue: Number(this.couponForm.discountValue),
      storeId: this.couponForm.storeId || null,
      maxUses: this.couponForm.maxUses ? Number(this.couponForm.maxUses) : null,
      expiresAt: this.couponForm.expiresAt
        ? new Date(this.couponForm.expiresAt).toISOString().replace('Z', '').split('.')[0]
        : null,
    };
    this.adminService.createCoupon(body).subscribe({
      next: c => { this.coupons.update(l => [c, ...l]); this.closeCouponModal(); },
      error: (err: any) => { this.couponSaving.set(false); this.couponError.set(err?.error?.message ?? 'Kupon oluşturulamadı.'); },
    });
  }

  deleteCoupon(id: number) {
    if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
    this.couponActionLoading.set(id);
    this.adminService.deleteCoupon(id).subscribe({
      next: () => { this.coupons.update(l => l.filter(c => c.id !== id)); this.couponActionLoading.set(null); },
      error: () => this.couponActionLoading.set(null),
    });
  }

  toggleCoupon(id: number) {
    this.couponActionLoading.set(id);
    this.adminService.toggleCoupon(id).subscribe({
      next: (updated: AdminCoupon) => { this.coupons.update(l => l.map(c => c.id === updated.id ? updated : c)); this.couponActionLoading.set(null); },
      error: () => this.couponActionLoading.set(null),
    });
  }

  // ── Orders ─────────────────────────────────────────────────────────────
  loadOrders(page = 0) {
    this.ordersLoading.set(true);
    this.adminService.getAllOrders(page, 20, this.ordersStatusFilter).subscribe({
      next: r => {
        this.orders.set(r.content); this.ordersTotal.set(r.totalElements);
        this.ordersPages.set(r.totalPages); this.ordersPage.set(r.number);
        this.ordersLoading.set(false);
      },
      error: () => this.ordersLoading.set(false),
    });
  }

  updateOrderStatus(orderId: number, status: string) {
    this.orderActionLoading.set(orderId);
    this.adminService.updateOrderStatus(orderId, status).subscribe({
      next: (updated: AdminOrder) => { this.orders.update(l => l.map(o => o.id === updated.id ? updated : o)); this.orderActionLoading.set(null); },
      error: () => this.orderActionLoading.set(null),
    });
  }

  toggleOrder(id: number) {
    this.expandedOrderId.update(v => v === id ? null : id);
  }

  orderStatusBadge(status: string): string {
    const m: Record<string, string> = {
      PENDING: 'bg-tertiary/10 text-tertiary',
      CONFIRMED: 'bg-primary/10 text-primary',
      PROCESSING: 'bg-primary/10 text-primary',
      SHIPPED: 'bg-secondary/10 text-secondary',
      DELIVERED: 'bg-secondary/10 text-secondary',
      CANCELLED: 'bg-error/10 text-error',
      RETURNED: 'bg-error/10 text-error',
    };
    return m[status] ?? 'bg-surface-container-high text-on-surface-variant';
  }

  // ── Products ───────────────────────────────────────────────────────────
  loadProducts(page = 0) {
    this.productsLoading.set(true);
    this.adminService.getAllProducts(page, 20, this.productsSearch).subscribe({
      next: r => {
        this.products.set(r.content); this.productsTotal.set(r.totalElements);
        this.productsPages.set(r.totalPages); this.productsPage.set(r.number);
        this.productsLoading.set(false);
      },
      error: () => this.productsLoading.set(false),
    });
  }

  // ── AI Support ─────────────────────────────────────────────────────────
  sendAiMessage() {
    const text = this.aiInput.trim();
    if (!text || this.aiLoading()) return;
    
    this.aiMessages.update(m => [...m, { 
      role: 'user', 
      text,
      timestamp: new Date()
    }]);
    
    this.aiInput = '';
    this.aiLoading.set(true);
    this.aiError.set('');
    
    this.http.post<any>(`${environment.apiUrl}/chat/ask`, { question: text }).subscribe({
      next: r => { 
        this.aiMessages.update(m => [...m, { 
          role: 'assistant', 
          text: r.answer || 'Yanıt alınamadı.',
          sqlQuery: r.sqlQuery,
          visualizationData: r.visualizationData,
          timestamp: new Date()
        }]); 
        this.aiLoading.set(false);
        
        // Render charts after a short delay to let the DOM update
        setTimeout(() => this.renderPendingCharts(), 100);
      },
      error: () => { 
        this.aiError.set('AI servisine ulaşılamadı. Lütfen API anahtarınızı ve servis durumunu kontrol edin.'); 
        this.aiLoading.set(false); 
      },
    });
  }

  private renderPendingCharts() {
    this.aiMessages().forEach((msg, i) => {
      if (msg.visualizationData && !this.renderedCharts.has(i)) {
        const el = document.getElementById(`admin-ai-chart-${i}`);
        if (el) {
          this.renderedCharts.add(i);
          import('plotly.js-dist-min').then((PlotlyModule: any) => {
            const Plotly = PlotlyModule.default || PlotlyModule;
            const fig = msg.visualizationData;
            Plotly.newPlot(el, fig.data ?? [], {
              ...fig.layout,
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              font: { family: 'Plus Jakarta Sans, sans-serif', size: 11 },
              margin: { t: 30, r: 10, b: 30, l: 30 },
            }, { responsive: true, displayModeBar: false });
          });
        }
      }
    });
  }

  handleAiKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); this.sendAiMessage(); }
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  pages(total: number, current: number): number[] {
    const range: number[] = [];
    for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) range.push(i);
    return range;
  }
}
