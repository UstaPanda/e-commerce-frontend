import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ScrollRowComponent } from '../../components/scroll-row/scroll-row';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { Product, Category, ProductService, getProductImage } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { CartService } from '../../services/cart.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollRowComponent, TranslateModule],
  templateUrl: './products.html',
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  currency = inject(CurrencyService);
  cartService = inject(CartService);

  // View state: 'browse' = ana sayfa, 'category' = kategori ürünleri
  view = signal<'browse' | 'category'>('browse');

  // Browse data
  popularProducts = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  stores = signal<{ id: number; name: string; description: string }[]>([]);
  browseLoading = signal(true);

  // Category accordion (sidebar)
  expandedCategoryId = signal<number | null>(null);

  // Category view data
  selectedCategory = signal<Category | null>(null);
  products = signal<Product[]>([]);
  initialLoading = signal(true);
  searching = signal(false);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  pageSize = 20;

  // Search
  searchQuery = '';
  suggestions = signal<string[]>([]);
  showSuggestions = signal(false);
  suggestLoading = signal(false);
  searchFocused = false;

  // Filters
  selectedCategoryId: number | null = null;
  selectedStoreId: number | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  priceError = false;
  sortOrder = '';
  minRating: number | null = null;

  private searchSubject = new Subject<string>();
  private suggestSubject = new Subject<string>();

  role = this.auth.getRole();
  canManage = this.role === 'CORPORATE' || this.role === 'ADMIN';

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this.searchQuery = q;
      this.view.set('category');
      this.selectedCategory.set(null);
    }

    this.loadBrowseData();
    if (q) this.loadProducts(0, false);

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

  loadBrowseData() {
    this.browseLoading.set(true);
    this.productService.getCategories().subscribe(cats => this.categories.set(cats));
    this.productService.getPopular(8).subscribe(p => {
      this.popularProducts.set(p);
      this.browseLoading.set(false);
    });
    this.productService.getStores().subscribe(res => this.stores.set(res.content));
  }

  selectCategory(cat: Category | null) {
    this.selectedCategory.set(cat);
    this.selectedCategoryId = cat?.id ?? null;
    this.view.set('category');
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

    // Category view'dayken her zaman filter endpoint'ini kullan
    // (categoryId null = tüm kategoriler, ama keyword/fiyat filtreleri yine çalışsın)
    const inCategoryView = this.view() === 'category';
    const hasExtraFilter = !!(this.searchQuery.trim() || this.minPrice != null || this.maxPrice != null);

    const obs = (inCategoryView || hasExtraFilter)
      ? this.productService.filter({
          keyword: this.searchQuery.trim() || undefined,
          categoryId: this.selectedCategoryId ?? undefined,
          minPrice: this.minPrice ?? undefined,
          maxPrice: this.maxPrice ?? undefined,
          minRating: this.minRating ?? undefined,
          sortOrder: this.sortOrder || undefined,
        }, page, this.pageSize)
      : this.productService.getAll(page, this.pageSize);

    obs.subscribe({
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
    if (this.view() === 'category') this.loadProducts();
  }

  highlightMatch(text: string, query: string): SafeHtml {
    if (!query.trim()) return this.sanitizer.bypassSecurityTrustHtml(text);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlighted = text.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="text-white font-semibold">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  onSearch(query: string) {
    this.searchQuery = query;
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

  selectSuggestion(name: string) {
    this.searchQuery = name;
    this.showSuggestions.set(false);
    this.currentPage.set(0);
    if (this.view() === 'browse') {
      // arama yapınca tüm ürünlerde ara
      this.selectedCategoryId = null;
      this.view.set('category');
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
      this.view.set('category');
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

  deleteProduct(id: number) {
    if (!confirm('Bu urunu silmek istediginize emin misiniz?')) return;
    this.productService.delete(id).subscribe({ next: () => this.loadProducts(this.currentPage(), true) });
  }

  get pages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const range: number[] = [];
    for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) range.push(i);
    return range;
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

  starsFor(rating: number): ('full' | 'half' | 'empty')[] {
    return Array.from({ length: 5 }, (_, i) => {
      if (i < Math.floor(rating)) return 'full';
      if (i === Math.floor(rating) && rating % 1 >= 0.5) return 'half';
      return 'empty';
    });
  }

  get hasActiveFilter(): boolean {
    return !!(this.searchQuery.trim() || this.minPrice != null || this.maxPrice != null ||
              this.sortOrder || this.minRating != null);
  }

  // Kategori için icon harfi
  categoryInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  // Sadece kök (parent=null) kategoriler
  get rootCategories(): Category[] {
    return this.categories().filter(c => !c.parent);
  }

  // Belirli bir kök kategorinin alt kategorileri
  childrenFor(parentId: number): Category[] {
    return this.categories().filter(c => c.parent?.id === parentId);
  }

  toggleCategoryExpand(catId: number) {
    this.expandedCategoryId.set(this.expandedCategoryId() === catId ? null : catId);
  }

  // Ürün kartı için kategori etiketi: (Ana Kategori, Alt Kategori) formatı
  getCategoryDisplayName(cat: Category | null): string {
    if (!cat) return '';
    if (cat.parent?.name) return `${cat.parent.name}, ${cat.name}`;
    return cat.name;
  }

  getProductImage(product: Product): string {
    return getProductImage(product);
  }

  onImgError(event: Event, product: Product): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = `https://loremflickr.com/600/450/product?lock=${product.id}`;
  }
}
