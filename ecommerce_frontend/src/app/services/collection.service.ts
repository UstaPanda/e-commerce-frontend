import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroments';

export interface CollectionItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  storeName: string | null;
  addedAt: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  itemCount: number;
  items: CollectionItem[];
  createdAt: string;
}

export interface CollectionRequest {
  name: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/collections`;

  getAll(): Observable<Collection[]> {
    return this.http.get<Collection[]>(this.base);
  }

  getDetail(id: number): Observable<Collection> {
    return this.http.get<Collection>(`${this.base}/${id}`);
  }

  create(req: CollectionRequest): Observable<Collection> {
    return this.http.post<Collection>(this.base, req);
  }

  update(id: number, req: CollectionRequest): Observable<Collection> {
    return this.http.patch<Collection>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  addProduct(collectionId: number, productId: number): Observable<Collection> {
    return this.http.post<Collection>(`${this.base}/${collectionId}/items/${productId}`, {});
  }

  removeProduct(collectionId: number, productId: number): Observable<Collection> {
    return this.http.delete<Collection>(`${this.base}/${collectionId}/items/${productId}`);
  }
}
