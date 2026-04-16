import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroments';

export interface UserAddress {
  id: number;
  title: string;
  fullAddress: string;
  city: string;
  district: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
  createdAt: string;
}

export interface UserAddressRequest {
  title: string;
  fullAddress: string;
  city: string;
  district?: string;
  postalCode?: string;
  phone?: string;
  isDefault: boolean;
}

@Injectable({ providedIn: 'root' })
export class AddressService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/addresses`;

  getAll(): Observable<UserAddress[]> {
    return this.http.get<UserAddress[]>(this.base);
  }

  create(req: UserAddressRequest): Observable<UserAddress> {
    return this.http.post<UserAddress>(this.base, req);
  }

  update(id: number, req: UserAddressRequest): Observable<UserAddress> {
    return this.http.put<UserAddress>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  setDefault(id: number): Observable<UserAddress> {
    return this.http.patch<UserAddress>(`${this.base}/${id}/default`, {});
  }
}
