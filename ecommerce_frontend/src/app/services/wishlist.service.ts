import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroments';

export interface WishlistItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  categoryName: string | null;
  storeName: string | null;
  addedAt: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/wishlist`;

  getAll(): Observable<WishlistItem[]> {
    return this.http.get<WishlistItem[]>(this.base);
  }

  check(productId: number): Observable<{ wishlisted: boolean }> {
    return this.http.get<{ wishlisted: boolean }>(`${this.base}/${productId}/check`);
  }

  add(productId: number): Observable<WishlistItem> {
    return this.http.post<WishlistItem>(`${this.base}/${productId}`, {});
  }

  remove(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${productId}`);
  }
}
