import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ScrollRowComponent } from '../../components/scroll-row/scroll-row';
import { AnalyticsService } from '../../services/analytics.service';
import { ProductService, Product, ProductRequest, buildProductImageUrl } from '../../services/product.service';
import { StoreService, StoreRequest } from '../../services/store.service';
import { CurrencyService } from '../../services/currency.service';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../enviroments/enviroments';

@Component({
  selector: 'app-my-store',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollRowComponent, TranslateModule],
  templateUrl: './my-store.html',
})
export class MyStoreComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private productService = inject(ProductService);
  private storeService = inject(StoreService);
  private http = inject(HttpClient);
  private router = inject(Router);
  currency = inject(CurrencyService);

  stores = signal<any[]>([]);
  selectedStore = signal<any>(null);
  products = signal<Product[]>([]);
  categories = signal<{ id: number; name: string }[]>([]);

  loading = signal(true);
  productsLoading = signal(false);

  // Tab
  activeTab = signal<'products' | 'reviews' | 'shipments'>('products');

  // Reviews
  reviews = signal<any[]>([]);
  reviewsLoading = signal(false);
  respondingId = signal<number | null>(null);
  responseText = '';
  respondSaving = signal(false);

  // Shipments
  shipments = signal<any[]>([]);
  shipmentsLoading = signal(false);
  showShipmentModal = signal(false);
  shipmentForm: any = {};
  shipmentSaving = signal(false);
  shipmentError = signal('');

  readonly statusLabels: Record<string, string> = {
    PENDING: 'Bekliyor', PROCESSING: 'İşlemde', SHIPPED: 'Kargoda',
    IN_TRANSIT: 'Yolda', OUT_FOR_DELIVERY: 'Dağıtımda', DELIVERED: 'Teslim',
    RETURNED: 'İade', CANCELLED: 'İptal',
  };
  readonly shipmentStatuses = ['PENDING','PROCESSING','SHIPPED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','RETURNED','CANCELLED'];

  readonly LOW_STOCK_THRESHOLD = 5;
  lowStockDismissed = signal(false);

  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  pageSize = 20;

  // Ürün modalı
  showProductModal = signal(false);
  editingProduct = signal<Product | null>(null);
  savingProduct = signal(false);
  productError = signal('');
  imagePreviewError = signal(false);

  productForm: ProductRequest = this.emptyProductForm();

  // Mağaza oluşturma modalı
  showStoreModal = signal(false);
  savingStore = signal(false);
  storeError = signal('');
  storeForm: StoreRequest = { name: '', description: '', address: '' };

  ngOnInit() {
    this.productService.getCategories().subscribe(cats => this.categories.set(cats));
    this.loadMyStores();
  }

  loadMyStores() {
    this.loading.set(true);
    this.analyticsService.getMyStores().subscribe({
      next: (stores) => {
        this.stores.set(stores);
        if (stores.length > 0) {
          this.selectedStore.set(stores[0]);
          this.loadProducts(stores[0].id, 0);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  selectStore(store: any) {
    this.selectedStore.set(store);
    this.currentPage.set(0);
    this.lowStockDismissed.set(false);
    this.activeTab.set('products');
    this.loadProducts(store.id, 0);
  }

  selectTab(tab: 'products' | 'reviews' | 'shipments') {
    this.activeTab.set(tab);
    const store = this.selectedStore();
    if (!store) return;
    if (tab === 'reviews' && this.reviews().length === 0) this.loadReviews(store.id);
    if (tab === 'shipments' && this.shipments().length === 0) this.loadShipments(store.id);
  }

  // ─── Reviews ─────────────────────────────────────────────
  loadReviews(storeId: number) {
    this.reviewsLoading.set(true);
    this.http.get<{ content: any[] }>(`${environment.apiUrl}/reviews/store/${storeId}`).subscribe({
      next: (p) => { this.reviews.set(p.content); this.reviewsLoading.set(false); },
      error: () => this.reviewsLoading.set(false),
    });
  }

  startRespond(reviewId: number) {
    this.respondingId.set(reviewId);
    this.responseText = '';
  }

  cancelRespond() {
    this.respondingId.set(null);
    this.responseText = '';
  }

  submitRespond(reviewId: number) {
    const text = this.responseText.trim();
    if (!text) return;
    this.respondSaving.set(true);
    this.http.patch<any>(`${environment.apiUrl}/reviews/${reviewId}/respond?response=${encodeURIComponent(text)}`, {}).subscribe({
      next: (updated) => {
        this.reviews.update(rs => rs.map(r => r.id === reviewId ? updated : r));
        this.respondingId.set(null);
        this.responseText = '';
        this.respondSaving.set(false);
      },
      error: () => this.respondSaving.set(false),
    });
  }

  starsArray(n: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i);
  }

  // ─── Shipments ────────────────────────────────────────────
  loadShipments(storeId: number) {
    this.shipmentsLoading.set(true);
    this.http.get<{ content: any[] }>(`${environment.apiUrl}/shipments/store/${storeId}`).subscribe({
      next: (p) => { this.shipments.set(p.content); this.shipmentsLoading.set(false); },
      error: () => this.shipmentsLoading.set(false),
    });
  }

  openShipmentModal() {
    this.shipmentForm = { orderId: '', carrier: '', modeOfShipment: 'Standard', estimatedDelivery: '' };
    this.shipmentError.set('');
    this.showShipmentModal.set(true);
  }

  closeShipmentModal() {
    this.showShipmentModal.set(false);
    this.shipmentSaving.set(false);
    this.shipmentError.set('');
  }

  saveShipment() {
    if (!this.shipmentForm.orderId) return;
    this.shipmentSaving.set(true);
    this.shipmentError.set('');
    const body: any = { orderId: Number(this.shipmentForm.orderId) };
    if (this.shipmentForm.carrier) body.carrier = this.shipmentForm.carrier;
    if (this.shipmentForm.modeOfShipment) body.modeOfShipment = this.shipmentForm.modeOfShipment;
    if (this.shipmentForm.estimatedDelivery) body.estimatedDelivery = this.shipmentForm.estimatedDelivery;
    this.http.post<any>(`${environment.apiUrl}/shipments`, body).subscribe({
      next: (s) => {
        this.shipments.update(list => [s, ...list]);
        this.closeShipmentModal();
      },
      error: () => {
        this.shipmentSaving.set(false);
        this.shipmentError.set('Kargo oluşturulamadı. Sipariş ID\'sini kontrol edin.');
      },
    });
  }

  updateShipmentStatus(shipmentId: number, status: string) {
    this.http.patch<any>(`${environment.apiUrl}/shipments/${shipmentId}/status?status=${status}`, {}).subscribe({
      next: (updated) => this.shipments.update(list => list.map(s => s.id === shipmentId ? updated : s)),
    });
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  loadProducts(storeId: number, page: number) {
    this.productsLoading.set(true);
    this.productService.getByStore(storeId, page, this.pageSize).subscribe({
      next: (res) => {
        this.products.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(page);
        this.loading.set(false);
        this.productsLoading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.productsLoading.set(false);
      },
    });
  }

  goToPage(page: number) {
    const store = this.selectedStore();
    if (!store || page < 0 || page >= this.totalPages()) return;
    this.loadProducts(store.id, page);
  }

  // ─── Mağaza modalı ───────────────────────────────────────────
  openStoreModal() {
    this.storeForm = { name: '', description: '', address: '' };
    this.storeError.set('');
    this.showStoreModal.set(true);
  }

  closeStoreModal() {
    this.showStoreModal.set(false);
    this.savingStore.set(false);
    this.storeError.set('');
  }

  saveStore() {
    if (!this.storeForm.name.trim()) return;
    this.savingStore.set(true);
    this.storeError.set('');
    this.storeService.create({
      name: this.storeForm.name.trim(),
      description: this.storeForm.description?.trim() || undefined,
      address: this.storeForm.address?.trim() || undefined,
    }).subscribe({
      next: () => {
        this.closeStoreModal();
        this.loadMyStores();
      },
      error: () => {
        this.savingStore.set(false);
        this.storeError.set('Mağaza oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      },
    });
  }

  // ─── Ürün modalı ─────────────────────────────────────────────
  openAddModal() {
    this.editingProduct.set(null);
    this.productForm = this.emptyProductForm();
    this.productError.set('');
    this.imagePreviewError.set(false);
    this.showProductModal.set(true);
  }

  openEditModal(product: Product, event: Event) {
    event.stopPropagation();
    this.editingProduct.set(product);
    this.imagePreviewError.set(false);
    this.productForm = {
      name: product.name,
      sku: product.sku,
      description: product.description ?? '',
      unitPrice: product.unitPrice,
      stockQuantity: product.stockQuantity,
      categoryId: product.category?.id,
      imageUrl: product.imageUrl ?? '',
    };
    this.productError.set('');
    this.showProductModal.set(true);
  }

  autoGenerateImage() {
    const catName = this.categories().find(c => c.id === this.productForm.categoryId)?.name;
    this.productForm.imageUrl = buildProductImageUrl(this.productForm.name, catName);
    this.imagePreviewError.set(false);
  }

  onImagePreviewError() {
    this.imagePreviewError.set(true);
  }

  closeProductModal() {
    this.showProductModal.set(false);
    this.editingProduct.set(null);
    this.savingProduct.set(false);
    this.productError.set('');
  }

  saveProductItem() {
    const store = this.selectedStore();
    if (!store) return;
    this.savingProduct.set(true);
    this.productError.set('');

    const editing = this.editingProduct();
    const obs = editing
      ? this.productService.update(editing.id, this.productForm)
      : this.productService.create(store.id, this.productForm);

    obs.subscribe({
      next: () => {
        this.closeProductModal();
        this.loadProducts(store.id, this.currentPage());
      },
      error: () => {
        this.savingProduct.set(false);
        this.productError.set('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      },
    });
  }

  deleteProduct(product: Product, event: Event) {
    event.stopPropagation();
    if (!confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) return;
    const store = this.selectedStore();
    this.productService.delete(product.id).subscribe({
      next: () => {
        if (store) this.loadProducts(store.id, this.currentPage());
      },
    });
  }

  goToProduct(id: number) {
    this.router.navigate(['/app/products', id]);
  }

  get lowStockProducts(): Product[] {
    return this.products().filter(p => p.stockQuantity <= this.LOW_STOCK_THRESHOLD);
  }

  get pages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const range: number[] = [];
    for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) range.push(i);
    return range;
  }

  private emptyProductForm(): ProductRequest {
    return {
      name: '',
      sku: this.generateSku(),
      description: '',
      unitPrice: 0,
      stockQuantity: 0,
      categoryId: undefined,
      imageUrl: '',
    };
  }

  private generateSku(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SKU-${ts}-${rand}`;
  }
}
