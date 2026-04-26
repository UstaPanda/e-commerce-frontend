import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroments';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);

  getIndividualAnalytics(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/analytics/me`);
  }

  getCorporateAnalytics(storeId: number, from?: string, to?: string): Observable<any> {
    let url = `${environment.apiUrl}/analytics/store/${storeId}`;
    const params: string[] = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length) url += '?' + params.join('&');
    return this.http.get(url);
  }

  getAdminAnalytics(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/admin/analytics`);
  }

  getMyStores(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/stores/my`);
  }
}
