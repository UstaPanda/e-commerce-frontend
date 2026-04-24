import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroments';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  gender: string;
  status: string;
  createdAt: string;
}

export interface AdminStore {
  id: number;
  name: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
  address: string;
  description: string;
  createdAt: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  parentId: number | null;
  parentName: string | null;
  productCount: number;
}

export interface AuditLog {
  id: number;
  actorName: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: number | null;
  details: string;
  createdAt: string;
}

export interface AdminOrder {
  id: number;
  userId: number;
  userEmail: string;
  storeId: number;
  storeName: string;
  status: string;
  grandTotal: number;
  paymentMethod: string;
  shippingAddress: string;
  items: { id: number; productId: number; productName: string; quantity: number; unitPrice: number; subtotal: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminProduct {
  id: number;
  sku: string;
  name: string;
  description: string;
  unitPrice: number;
  stockQuantity: number;
  imageUrl: string;
  active: boolean;
  store: { id: number; name: string };
  category: { id: number; name: string } | null;
}

export interface AdminCoupon {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  storeId: number | null;
  storeName: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;

  // ── Users ──────────────────────────────────────────────
  getUsers(page = 0, size = 20, search = ''): Observable<PageResponse<AdminUser>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('keyword', search);
    return this.http.get<PageResponse<AdminUser>>(`${this.base}/users`, { params });
  }

  suspendUser(userId: number): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.base}/users/${userId}/suspend`, {});
  }

  unsuspendUser(userId: number): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.base}/users/${userId}/unsuspend`, {});
  }

  updateUserStatus(userId: number, status: string): Observable<AdminUser> {
    if (status === 'SUSPENDED') return this.suspendUser(userId);
    return this.unsuspendUser(userId);
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${userId}`);
  }

  // ── Stores ─────────────────────────────────────────────
  getAllStores(page = 0, size = 20, search = ''): Observable<PageResponse<AdminStore>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    return this.http.get<PageResponse<AdminStore>>(`${this.base}/stores`, { params });
  }

  updateStoreStatus(storeId: number, status: string): Observable<AdminStore> {
    return this.http.put<AdminStore>(`${this.base}/stores/${storeId}/status`, { status });
  }

  // ── Categories ─────────────────────────────────────────
  getCategories(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>(`${this.base}/categories`);
  }

  createCategory(name: string, parentId: number | null): Observable<AdminCategory> {
    return this.http.post<AdminCategory>(`${this.base}/categories`, { name, parentId });
  }

  updateCategory(id: number, name: string, parentId: number | null): Observable<AdminCategory> {
    return this.http.put<AdminCategory>(`${this.base}/categories/${id}`, { name, parentId });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/categories/${id}`);
  }

  // ── Audit Logs ─────────────────────────────────────────
  getAuditLogs(page = 0, size = 30, action = ''): Observable<PageResponse<AuditLog>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (action) params = params.set('action', action);
    return this.http.get<PageResponse<AuditLog>>(`${this.base}/audit-logs`, { params });
  }

  // ── Coupons ────────────────────────────────────────────
  getCoupons(page = 0, size = 20): Observable<PageResponse<AdminCoupon>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<AdminCoupon>>(`${this.base}/coupons`, { params });
  }

  createCoupon(body: Partial<AdminCoupon> & { storeId?: number | null }): Observable<AdminCoupon> {
    return this.http.post<AdminCoupon>(`${this.base}/coupons`, body);
  }

  deleteCoupon(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/coupons/${id}`);
  }

  toggleCoupon(id: number): Observable<AdminCoupon> {
    return this.http.patch<AdminCoupon>(`${this.base}/coupons/${id}/toggle`, {});
  }

  // ── Orders ─────────────────────────────────────────────
  getAllOrders(page = 0, size = 20, status = ''): Observable<PageResponse<AdminOrder>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<AdminOrder>>(`${this.base}/orders`, { params });
  }

  updateOrderStatus(orderId: number, status: string): Observable<AdminOrder> {
    return this.http.patch<AdminOrder>(`${this.base}/orders/${orderId}/status?status=${status}`, {});
  }

  // ── Products ───────────────────────────────────────────
  getAllProducts(page = 0, size = 20, keyword = ''): Observable<PageResponse<AdminProduct>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<PageResponse<AdminProduct>>(`${this.base}/products`, { params });
  }

  // ── Analytics ──────────────────────────────────────────
  getAnalytics(): Observable<any> {
    return this.http.get(`${this.base}/analytics`);
  }
}
