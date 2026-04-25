import { Component, inject, OnInit, OnDestroy, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { ProductService, Product, Category, getProductImage } from '../../services/product.service';
import { CurrencyService } from '../../services/currency.service';
import { CartService } from '../../services/cart.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { ScrollRowComponent } from '../../components/scroll-row/scroll-row';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollRowComponent, TranslateModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  currency = inject(CurrencyService);
  cartService = inject(CartService);
  private analytics = inject(AnalyticsService);
  private productService = inject(ProductService);
  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  user = this.auth.currentUser;
  kpiCards: { label: string; value: string; icon: string }[] = [];
  kpiLoading = true;

  // View: 'browse' = ana keşif, 'search' = arama/kategori sonuçları
  view = signal<'browse' | 'search'>('browse');

  // Browse data
  categories = signal<Category[]>([]);
  rootCategories = signal<Category[]>([]);
  popularProducts = signal<Product[]>([]);
  stores = signal<{ id: number; name: string; description: string }[]>([]);
  browseLoading = signal(true);

  // Search / filter state
  searchQuery = '';
  searchFocused = false;
  suggestions = signal<string[]>([]);
  showSuggestions = signal(false);
  suggestLoading = signal(false);

  selectedCategory = signal<{ id: number; name: string } | null>(null);
  selectedCategoryId: number | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  priceError = false;
  sortOrder = '';
  minRating: number | null = null;

  // Products
  products = signal<Product[]>([]);
  initialLoading = signal(true);
  searching = signal(false);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  pageSize = 20;

  private searchSubject = new Subject<string>();
  private suggestSubject = new Subject<string>();

  ngOnInit() {
    const role = this.user()?.role;
    if (role === 'INDIVIDUAL') this.loadIndividual();
    else if (role === 'CORPORATE') this.loadCorporate();
    else if (role === 'ADMIN') this.loadAdmin();
    else this.kpiLoading = false;

    this.loadBrowseData();

    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this.searchQuery = q;
      this.view.set('search');
      this.loadProducts(0, false);
    }

    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.currentPage.set(0);
      this.loadProducts(0, true);
    });

    this.suggestSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(kw => {
        if (kw.trim().length < 2) { this.suggestLoading.set(false); return of([]); }
        this.suggestLoading.set(true);
        return this.productService.getSuggestions(kw).pipe(catchError(() => of([])));
      }),
    ).subscribe(s => {
      this.suggestions.set(s as string[]);
      this.suggestLoading.set(false);
    });
  }

  ngOnDestroy() {}

  get categoriesGrouped(): { root: Category; children: Category[] }[] {
    const all = this.categories();
    const roots = all.filter(c => !c.parent);
    return roots.map(root => ({
      root,
      children: all.filter(c => c.parent?.id === root.id),
    }));
  }

  loadBrowseData() {
    this.browseLoading.set(true);
    this.productService.getRootCategories().subscribe(cats => this.rootCategories.set(cats));
    this.productService.getCategories().subscribe(cats => this.categories.set(cats));
    this.productService.getPopular(8).subscribe(p => {
      this.popularProducts.set(p);
      this.browseLoading.set(false);
    });
    this.productService.getStores().subscribe(res => this.stores.set(res.content));
  }

  selectCategory(cat: { id: number; name: string } | null) {
    this.selectedCategory.set(cat);
    this.selectedCategoryId = cat?.id ?? null;
    this.view.set('search');
    this.currentPage.set(0);
    this.loadProducts(0, false);
  }

  backToBrowse() {
    this.view.set('browse');
    this.selectedCategory.set(null);
    this.selectedCategoryId = null;
    this.searchQuery = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.priceError = false;
    this.sortOrder = '';
    this.minRating = null;
  }

  loadProducts(page = 0, soft = false) {
    if (!soft) this.initialLoading.set(true);
    else this.searching.set(true);

    this.productService.filter({
      keyword: this.searchQuery.trim() || undefined,
      categoryId: this.selectedCategoryId ?? undefined,
      minPrice: this.minPrice ?? undefined,
      maxPrice: this.maxPrice ?? undefined,
      minRating: this.minRating ?? undefined,
      sortOrder: this.sortOrder || undefined,
    }, page, this.pageSize).subscribe({
      next: (res) => {
        this.products.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.initialLoading.set(false);
        this.searching.set(false);
      },
      error: () => { this.initialLoading.set(false); this.searching.set(false); },
    });
  }

  onSearch(query: string) {
    this.searchQuery = query;
    if (this.view() === 'browse') {
      this.view.set('search');
      this.selectedCategoryId = null;
      this.selectedCategory.set(null);
    }
    this.searchSubject.next(query);
    if (query.trim().length >= 2) {
      this.showSuggestions.set(true);
      this.suggestSubject.next(query);
    } else {
      this.suggestions.set([]);
      this.suggestLoading.set(false);
      this.showSuggestions.set(false);
    }
  }

  onSearchFocus() {
    this.searchFocused = true;
    if (this.searchQuery.trim().length >= 2) this.showSuggestions.set(true);
  }

  onSearchBlur() {
    this.searchFocused = false;
    setTimeout(() => this.showSuggestions.set(false), 150);
  }

  clearSearch() {
    this.searchQuery = '';
    this.suggestions.set([]);
    this.showSuggestions.set(false);
    this.currentPage.set(0);
    if (this.view() === 'search') this.loadProducts();
  }

  selectSuggestion(name: string) {
    this.searchQuery = name;
    this.showSuggestions.set(false);
    this.currentPage.set(0);
    if (this.view() === 'browse') {
      this.selectedCategoryId = null;
      this.view.set('search');
      this.selectedCategory.set(null);
    }
    this.loadProducts(0, true);
  }

  onMinChange(val: number | null) {
    this.minPrice = val != null && val < 0 ? 0 : val;
    this.priceError = !!(this.minPrice != null && this.maxPrice != null && this.minPrice > this.maxPrice);
  }

  onMaxChange(val: number | null) {
    this.maxPrice = val != null && val < 0 ? 0 : val;
    this.priceError = !!(this.minPrice != null && this.maxPrice != null && this.minPrice > this.maxPrice);
  }

  applyFilters() {
    if (this.priceError) return;
    this.currentPage.set(0);
    this.showSuggestions.set(false);
    if (this.view() === 'browse') {
      this.view.set('search');
      this.selectedCategory.set(null);
    }
    this.loadProducts(0, true);
  }

  clearFilters() {
    this.searchQuery = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.priceError = false;
    this.sortOrder = '';
    this.minRating = null;
    this.currentPage.set(0);
    this.loadProducts();
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadProducts(page, true);
  }

  get pages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const range: number[] = [];
    for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) range.push(i);
    return range;
  }

  get hasActiveFilter(): boolean {
    return !!(this.searchQuery.trim() || this.minPrice != null || this.maxPrice != null ||
              this.selectedCategoryId != null || this.sortOrder || this.minRating != null);
  }

  addToCart(product: Product, event: Event) {
    event.stopPropagation();
    this.cartService.addItem(product.id).subscribe({
      next: () => this.router.navigate(['/app/cart']),
      error: () => {},
    });
  }

  goToProduct(id: number) {
    this.router.navigate(['/app/products', id]);
  }

  goToStore(id: number) {
    this.router.navigate(['/app/stores', id]);
  }

  highlightMatch(text: string, query: string): SafeHtml {
    if (!query.trim()) return this.sanitizer.bypassSecurityTrustHtml(text);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlighted = text.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="text-primary font-semibold">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  categoryInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  getProductImage(product: Product, width = 600, height?: number): string {
    return getProductImage(product, width, height);
  }

  onImgError(event: Event, product: Product): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = `https://loremflickr.com/600/450/product?lock=${product.id}`;
  }

  private loadIndividual() {
    this.analytics.getIndividualAnalytics().subscribe({
      next: (data) => {
        this.kpiCards = [
          { label: 'Toplam Sipariş', value: String(data.totalOrders), icon: 'receipt_long' },
          { label: 'Toplam Harcama', value: this.currency.format(data.totalSpend), icon: 'payments' },
          { label: 'Ort. Sipariş', value: this.currency.format(data.avgOrderValue), icon: 'trending_up' },
          { label: 'Toplam Yorum', value: String(data.totalReviews), icon: 'star' },
        ];
        this.kpiLoading = false;
      },
      error: () => { this.kpiLoading = false; },
    });
  }

  private loadCorporate() {
    this.analytics.getMyStores().pipe(
      switchMap((stores) => this.analytics.getCorporateAnalytics(stores[0]?.id))
    ).subscribe({
      next: (data) => {
        this.kpiCards = [
          { label: 'Toplam Gelir', value: this.currency.format(data.totalRevenue), icon: 'payments' },
          { label: 'Toplam Sipariş', value: String(data.totalOrders), icon: 'receipt_long' },
          { label: 'Toplam Ürün', value: String(data.totalProducts), icon: 'inventory_2' },
          { label: 'Ort. Puan', value: data.avgReviewRating.toFixed(1), icon: 'star' },
        ];
        this.kpiLoading = false;
      },
      error: () => { this.kpiLoading = false; },
    });
  }

  private loadAdmin() {
    this.analytics.getAdminAnalytics().subscribe({
      next: (data) => {
        this.kpiCards = [
          { label: 'Kullanıcılar', value: String(data.totalUsers), icon: 'group' },
          { label: 'Mağazalar', value: String(data.totalStores), icon: 'storefront' },
          { label: 'Siparişler', value: String(data.totalOrders), icon: 'receipt_long' },
          { label: 'Toplam Gelir', value: this.currency.format(data.totalRevenue), icon: 'payments' },
        ];
        this.kpiLoading = false;
      },
      error: () => { this.kpiLoading = false; },
    });
  }
}
