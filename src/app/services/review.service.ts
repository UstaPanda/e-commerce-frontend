import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroments';
import { PageResponse } from './product.service';

export interface ReviewResponse {
  id: number;
  userId: number;
  userName: string;
  productId: number;
  productName: string;
  starRating: number;
  comment: string;
  helpfulVotes: number;
  totalVotes: number;
  sentiment: string | null;
  storeResponse: string | null;
  storeRespondedAt: string | null;
  createdAt: string;
}

/** Kullanıcının bir yoruma verdiği oy durumu */
export type VoteState = 'liked' | 'disliked' | null;

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);

  getByProduct(productId: number, page = 0, size = 20): Observable<PageResponse<ReviewResponse>> {
    return this.http.get<PageResponse<ReviewResponse>>(
      `${environment.apiUrl}/reviews/product/${productId}?page=${page}&size=${size}`
    );
  }

  create(productId: number, starRating: number, comment: string): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${environment.apiUrl}/reviews`, { productId, starRating, comment });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/reviews/${id}`);
  }

  vote(id: number, helpful: boolean): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(
      `${environment.apiUrl}/reviews/${id}/vote?helpful=${helpful}`, {}
    );
  }
}
