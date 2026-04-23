import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { StoreService, StoreDetail, StoreStats } from '../../services/store.service';
import { ProductService, Product, getProductImage } from '../../services/product.service';
import { CurrencyService } from '../../services/currency.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './store-detail.html',
})
export class StoreDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storeService = inject(StoreService);
  private productService = inject(ProductService);
  currency = inject(CurrencyService);

  store = signal<StoreDetail | null>(null);
  stats = signal<StoreStats | null>(null);
  products = signal<Product[]>([]);
  totalProducts = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  loading = signal(true);
  pageSize = 20;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);

    forkJoin({
      store: this.storeService.getById(id),
      stats: this.storeService.getStats(id),
    }).subscribe({
      next: ({ store, stats }) => {
        this.store.set(store);
        this.stats.set(stats);
        this.loadProducts(id, 0);
      },
      error: () => this.router.navigate(['/app/products']),
    });
  }

  loadProducts(storeId: number, page: number) {
    this.productService.getByStore(storeId, page, this.pageSize).subscribe({
      next: (res) => {
        this.products.set(res.content);
        this.totalProducts.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToPage(page: number) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (page < 0 || page >= this.totalPages()) return;
    this.loadProducts(id, page);
  }

  goToProduct(id: number) {
    this.router.navigate(['/app/products', id]);
  }

  back() {
    this.router.navigate(['/app/products']);
  }

  starsFor(rating: number): ('full' | 'half' | 'empty')[] {
    return Array.from({ length: 5 }, (_, i) => {
      if (i < Math.floor(rating)) return 'full';
      if (i === Math.floor(rating) && rating % 1 >= 0.5) return 'half';
      return 'empty';
    });
  }

  getProductImage(product: Product): string {
    return getProductImage(product);
  }

  onImgError(event: Event, product: Product): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = `https://loremflickr.com/600/450/product?lock=${product.id}`;
  }

  get pages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const range: number[] = [];
    for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) range.push(i);
    return range;
  }
}
