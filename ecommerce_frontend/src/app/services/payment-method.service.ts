import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroments';

export type PaymentType = 'STRIPE' | 'PAYPAL' | 'CRYPTO';

export interface SavedPaymentMethod {
  id: number;
  type: PaymentType;
  label: string;
  // Stripe
  cardLast4: string | null;
  cardBrand: string | null;
  stripePaymentMethodId: string | null;
  // PayPal
  paypalEmail: string | null;
  // Crypto
  walletAddress: string | null;
  chainId: number | null;
  chainName: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface SavedPaymentMethodRequest {
  type: PaymentType;
  label: string;
  cardLast4?: string;
  cardBrand?: string;
  stripePaymentMethodId?: string;
  paypalEmail?: string;
  walletAddress?: string;
  chainId?: number;
  chainName?: string;
  isDefault?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PaymentMethodService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/payment-methods`;

  getAll(): Observable<SavedPaymentMethod[]> {
    return this.http.get<SavedPaymentMethod[]>(this.base);
  }

  add(req: SavedPaymentMethodRequest): Observable<SavedPaymentMethod> {
    return this.http.post<SavedPaymentMethod>(this.base, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  setDefault(id: number): Observable<SavedPaymentMethod> {
    return this.http.patch<SavedPaymentMethod>(`${this.base}/${id}/default`, {});
  }
}
