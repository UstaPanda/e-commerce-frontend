import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroments';

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  unitPrice: number;
  stockQuantity: number;
  productImportance: string;
  active: boolean;
  store: { id: number; name: string };
  category: { id: number; name: string } | null;
  avgRating: number;
  reviewCount: number;
}

export interface ProductRequest {
  name: string;
  sku: string;
  description?: string;
  unitPrice: number;
  stockQuantity?: number;
  categoryId?: number;
  productImportance?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getAll(page = 0, size = 20): Observable<PageResponse<Product>> {
    return this.http.get<PageResponse<Product>>(`${environment.apiUrl}/products?page=${page}&size=${size}`);
  }

  search(keyword: string, page = 0, size = 20): Observable<PageResponse<Product>> {
    return this.http.get<PageResponse<Product>>(`${environment.apiUrl}/products/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
  }

  getByStore(storeId: number, page = 0, size = 20): Observable<PageResponse<Product>> {
    return this.http.get<PageResponse<Product>>(`${environment.apiUrl}/products/store/${storeId}?page=${page}&size=${size}`);
  }

  filter(params: { keyword?: string; categoryId?: number; minPrice?: number; maxPrice?: number }, page = 0, size = 20): Observable<PageResponse<Product>> {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.categoryId) query.set('categoryId', String(params.categoryId));
    if (params.minPrice != null) query.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) query.set('maxPrice', String(params.maxPrice));
    return this.http.get<PageResponse<Product>>(`${environment.apiUrl}/products/filter?${query}`);
  }

  getSuggestions(keyword: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/products/suggestions?keyword=${encodeURIComponent(keyword)}`);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${environment.apiUrl}/products/${id}`);
  }

  getPopular(limit = 8): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/products/popular?limit=${limit}`);
  }

  getStores(): Observable<{ content: { id: number; name: string; description: string }[] }> {
    return this.http.get<any>(`${environment.apiUrl}/stores?size=50`);
  }

  getCategories(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/categories`);
  }

  create(storeId: number, data: ProductRequest): Observable<Product> {
    return this.http.post<Product>(`${environment.apiUrl}/products/store/${storeId}`, data);
  }

  update(id: number, data: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${environment.apiUrl}/products/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/products/${id}`);
  }
}
