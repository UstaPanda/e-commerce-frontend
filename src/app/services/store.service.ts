import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroments';

export interface StoreDetail {
  id: number;
  name: string;
  description: string;
  address: string | null;
  status: string;
}

export interface StoreStats {
  avgRating: number;
  reviewCount: number;
  productCount: number;
}

export interface StoreRequest {
  name: string;
  description?: string;
  address?: string;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private http = inject(HttpClient);

  getById(id: number): Observable<StoreDetail> {
    return this.http.get<StoreDetail>(`${environment.apiUrl}/stores/${id}`);
  }

  getStats(id: number): Observable<StoreStats> {
    return this.http.get<StoreStats>(`${environment.apiUrl}/stores/${id}/stats`);
  }

  create(req: StoreRequest): Observable<StoreDetail> {
    return this.http.post<StoreDetail>(`${environment.apiUrl}/stores`, req);
  }
}
