import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../enviroments/enviroments';

export interface UserAddress {
  id: number;
  title: string;
  fullAddress: string;
  city: string;
  district: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface UserAddressRequest {
  title: string;
  fullAddress: string;
  city: string;
  district?: string;
  postalCode?: string;
  isDefault: boolean;
}

@Injectable({ providedIn: 'root' })
export class AddressService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/addresses`;

  private selectedAddressSubject = new BehaviorSubject<UserAddress | null>(null);
  selectedAddress$ = this.selectedAddressSubject.asObservable();
  selectedAddress = toSignal(this.selectedAddress$, { initialValue: null as UserAddress | null });

  selectAddress(address: UserAddress | null): void {
    this.selectedAddressSubject.next(address);
  }

  getSelectedAddress(): UserAddress | null {
    return this.selectedAddressSubject.getValue();
  }

  getAll(): Observable<UserAddress[]> {
    return this.http.get<UserAddress[]>(this.base);
  }

  create(req: UserAddressRequest): Observable<UserAddress> {
    return this.http.post<UserAddress>(this.base, req).pipe(
      tap(addr => this.selectedAddressSubject.next(addr))
    );
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
