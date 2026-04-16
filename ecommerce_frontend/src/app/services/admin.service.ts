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
    if (search) params = params.set('search', search);
    return this.http.get<PageResponse<AdminUser>>(`${this.base}/users`, { params });
  }

  updateUserStatus(userId: number, status: string): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.base}/users/${userId}/status`, { status });
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
}
