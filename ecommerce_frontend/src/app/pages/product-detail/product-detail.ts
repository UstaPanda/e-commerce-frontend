import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, getProductImage } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { CurrencyService } from '../../services/currency.service';
import { AuthService } from '../../services/auth.service';
import { ReviewService, ReviewResponse, VoteState } from '../../services/review.service';
import { WishlistService } from '../../services/wishlist.service';
import { CollectionService, Collection, CollectionRequest } from '../../services/collection.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './product-detail.html',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private reviewService = inject(ReviewService);
  private wishlistService = inject(WishlistService);
  private collectionService = inject(CollectionService);
  currency = inject(CurrencyService);
  private auth = inject(AuthService);
  private translate = inject(TranslateService);

  product = signal<Product | null>(null);
  loading = signal(true);
  quantity = 1;
  addingToCart = signal(false);
  addedToCart = signal(false);
  cartError = signal('');

  // Wishlist
  wishlisted = signal(false);
  wishlistLoading = signal(false);

  // Collection modal
  showCollectionModal = signal(false);
  collections = signal<Collection[]>([]);
  collectionsLoading = signal(false);
  collectionModalView = signal<'list' | 'create'>('list');
  addingToCollectionId = signal<number | null>(null);
  collectionSuccess = signal('');
  newCollectionName = '';
  newCollectionDesc = '';
  creatingCollection = signal(false);

  // Reviews
  reviews = signal<ReviewResponse[]>([]);
  reviewsLoading = signal(false);
  totalReviews = signal(0);

  avgRating = computed(() => {
    const r = this.reviews();
    if (!r.length) return 0;
    return r.reduce((sum, rev) => sum + rev.starRating, 0) / r.length;
  });

  // New review form
  newRating = 0;
  hoverRating = 0;
  newComment = '';
  submittingReview = signal(false);
  reviewError = signal('');
  reviewPosted = signal(false);

  // Vote (like/dislike) — reviewId başına kullanıcının aktif oy durumu
  votingId = signal<number | null>(null);
  /** reviewId → 'liked' | 'disliked' | null */
  private userVoteMap = new Map<number, VoteState>();

  role = this.auth.getRole();
  canOrder = this.role === 'INDIVIDUAL';
  isLoggedIn = this.auth.isLoggedIn();

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getById(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
        this.loadReviews(p.id);
        if (this.isLoggedIn) this.checkWishlist(p.id);
      },
      error: () => { this.loading.set(false); this.router.navigate(['/app/products']); }
    });
  }

  checkWishlist(productId: number) {
    this.wishlistService.check(productId).subscribe({
      next: (res) => this.wishlisted.set(res.wishlisted),
      error: () => {}
    });
  }

  toggleWishlist() {
    const p = this.product();
    if (!p || this.wishlistLoading()) return;
    this.wishlistLoading.set(true);
    if (this.wishlisted()) {
      this.wishlistService.remove(p.id).subscribe({
        next: () => { this.wishlisted.set(false); this.wishlistLoading.set(false); },
        error: () => this.wishlistLoading.set(false)
      });
    } else {
      this.wishlistService.add(p.id).subscribe({
        next: () => { this.wishlisted.set(true); this.wishlistLoading.set(false); },
        error: () => this.wishlistLoading.set(false)
      });
    }
  }

  openCollectionModal() {
    this.showCollectionModal.set(true);
    this.collectionModalView.set('list');
    this.collectionSuccess.set('');
    this.collectionsLoading.set(true);
    this.collectionService.getAll().subscribe({
      next: (cols) => { this.collections.set(cols); this.collectionsLoading.set(false); },
      error: () => this.collectionsLoading.set(false)
    });
  }

  closeCollectionModal() {
    this.showCollectionModal.set(false);
    this.newCollectionName = '';
    this.newCollectionDesc = '';
    this.collectionSuccess.set('');
  }

  addToCollection(collectionId: number) {
    const p = this.product();
    if (!p) return;
    this.addingToCollectionId.set(collectionId);
    this.collectionService.addProduct(collectionId, p.id).subscribe({
      next: () => {
        this.addingToCollectionId.set(null);
        this.collectionSuccess.set(this.translate.instant('PRODUCT_DETAIL.COLLECTION_ADDED'));
        setTimeout(() => { this.collectionSuccess.set(''); this.closeCollectionModal(); }, 1500);
      },
      error: () => this.addingToCollectionId.set(null)
    });
  }

  showCreateCollectionView() {
    this.newCollectionName = '';
    this.newCollectionDesc = '';
    this.collectionModalView.set('create');
  }

  createAndAddToCollection() {
    const p = this.product();
    if (!p || !this.newCollectionName.trim()) return;
    this.creatingCollection.set(true);
    const req: CollectionRequest = { name: this.newCollectionName.trim(), description: this.newCollectionDesc.trim() || undefined };
    this.collectionService.create(req).subscribe({
      next: (col) => {
        this.collectionService.addProduct(col.id, p.id).subscribe({
          next: () => {
            this.creatingCollection.set(false);
            this.collectionSuccess.set(this.translate.instant('PRODUCT_DETAIL.COLLECTION_CREATED', { name: col.name }));
            setTimeout(() => { this.collectionSuccess.set(''); this.closeCollectionModal(); }, 1800);
          },
          error: () => this.creatingCollection.set(false)
        });
      },
      error: () => this.creatingCollection.set(false)
    });
  }

  loadReviews(productId: number) {
    this.reviewsLoading.set(true);
    this.reviewService.getByProduct(productId, 0, 50).subscribe({
      next: (page) => {
        this.reviews.set(page.content);
        this.totalReviews.set(page.totalElements);
        this.reviewsLoading.set(false);
      },
      error: () => this.reviewsLoading.set(false)
    });
  }

  submitReview() {
    const p = this.product();
    if (!p || this.newRating < 1) { this.reviewError.set(this.translate.instant('PRODUCT_DETAIL.REVIEW_PLACEHOLDER')); return; }
    this.submittingReview.set(true);
    this.reviewError.set('');
    this.reviewService.create(p.id, this.newRating, this.newComment).subscribe({
      next: (review) => {
        this.reviews.update(list => [review, ...list]);
        this.totalReviews.update(n => n + 1);
        this.newRating = 0;
        this.newComment = '';
        this.submittingReview.set(false);
        this.reviewPosted.set(true);
        setTimeout(() => this.reviewPosted.set(false), 3000);
      },
      error: (err) => {
        this.submittingReview.set(false);
        this.reviewError.set(err?.error?.message ?? this.translate.instant('PRODUCT_DETAIL.SUBMIT_REVIEW'));
      }
    });
  }

  deleteReview(reviewId: number) {
    this.reviewService.delete(reviewId).subscribe({
      next: () => {
        this.reviews.update(list => list.filter(r => r.id !== reviewId));
        this.totalReviews.update(n => n - 1);
      }
    });
  }

  voteReview(reviewId: number, helpful: boolean) {
    if (this.votingId() !== null) return;
    this.votingId.set(reviewId);

    const currentVote = this.userVoteMap.get(reviewId) ?? null;
    const newVote: VoteState = currentVote === (helpful ? 'liked' : 'disliked') ? null
      : helpful ? 'liked' : 'disliked';

    this.reviewService.vote(reviewId, helpful).subscribe({
      next: (updated) => {
        this.reviews.update(list => list.map(r => r.id === reviewId ? updated : r));
        this.userVoteMap.set(reviewId, newVote);
        this.votingId.set(null);
      },
      error: () => this.votingId.set(null),
    });
  }

  getUserVote(reviewId: number): VoteState {
    return this.userVoteMap.get(reviewId) ?? null;
  }

  addToCart() {
    const p = this.product();
    if (!p || this.quantity < 1) return;
    this.addingToCart.set(true);
    this.cartError.set('');
    this.cartService.addItem(p.id, this.quantity).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.addedToCart.set(true);
        setTimeout(() => this.addedToCart.set(false), 2000);
      },
      error: (err) => {
        this.addingToCart.set(false);
        this.cartError.set(err?.error?.message ?? this.translate.instant('PRODUCT_DETAIL.CART_ERROR'));
      }
    });
  }

  goToCart() {
    this.router.navigate(['/app/cart']);
  }

  back() {
    this.router.navigate(['/app/products']);
  }

  // Returns array of 5 items: 'full' | 'half' | 'empty'
  starsFor(rating: number): ('full' | 'half' | 'empty')[] {
    return Array.from({ length: 5 }, (_, i) => {
      if (i < Math.floor(rating)) return 'full';
      if (i === Math.floor(rating) && rating % 1 >= 0.5) return 'half';
      return 'empty';
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  get stockClass(): string {
    const s = this.product()?.stockQuantity ?? 0;
    if (s > 10) return 'text-green-400';
    if (s > 0) return 'text-yellow-400';
    return 'text-red-400';
  }

  getProductImage(product: Product): string {
    return getProductImage(product, 800);
  }

  getProductThumb(product: Product): string {
    return getProductImage(product, 160, 160);
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    const p = this.product();
    img.src = `https://loremflickr.com/800/600/product?lock=${p?.id ?? 0}`;
  }
}
