import { Injectable, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../enviroments/enviroments';

export interface CartItemResponse {
  cartItemId: number;
  productId: number;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  imageUrl: string | null;
}

export interface CartResponse {
  cartId: number;
  storeId: number;
  storeName: string;
  items: CartItemResponse[];
  totalPrice: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);

  private cartSubject = new BehaviorSubject<CartResponse | null>(null);
  cart$ = this.cartSubject.asObservable();

  // Signal for template use — stays in sync with BehaviorSubject automatically
  cart = toSignal(this.cart$, { initialValue: null as CartResponse | null });

  // Reactive item count as a computed signal
  itemCount = computed(() =>
    this.cart()?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0
  );

  load() {
    return this.http.get<CartResponse>(`${environment.apiUrl}/cart`).pipe(
      tap(c => this.cartSubject.next(c))
    );
  }

  addItem(productId: number, quantity = 1) {
    return this.http.post<CartResponse>(`${environment.apiUrl}/cart/items`, { productId, quantity }).pipe(
      tap(c => this.cartSubject.next(c))
    );
  }

  updateItem(cartItemId: number, quantity: number) {
    return this.http.patch<CartResponse>(`${environment.apiUrl}/cart/items/${cartItemId}?quantity=${quantity}`, {}).pipe(
      tap(c => this.cartSubject.next(c))
    );
  }

  removeItem(cartItemId: number) {
    return this.http.delete<CartResponse>(`${environment.apiUrl}/cart/items/${cartItemId}`).pipe(
      tap(c => this.cartSubject.next(c))
    );
  }

  clear() {
    return this.http.delete<void>(`${environment.apiUrl}/cart`).pipe(
      tap(() => this.cartSubject.next(null))
    );
  }

  checkout(paymentMethod: string, shippingAddress: string, txHash?: string, chainId?: number, couponCode?: string) {
    let url = `${environment.apiUrl}/cart/checkout`
      + `?paymentMethod=${encodeURIComponent(paymentMethod)}`
      + `&shippingAddress=${encodeURIComponent(shippingAddress)}`;
    if (txHash)     url += `&txHash=${encodeURIComponent(txHash)}`;
    if (chainId)    url += `&chainId=${chainId}`;
    if (couponCode) url += `&couponCode=${encodeURIComponent(couponCode)}`;
    return this.http.post(url, {});
  }

  resetCart() {
    this.cartSubject.next(null);
  }
}
