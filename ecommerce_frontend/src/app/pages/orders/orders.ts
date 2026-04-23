import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurrencyService } from '../../services/currency.service';
import { environment } from '../../../enviroments/enviroments';
import { TranslateModule } from '@ngx-translate/core';

export interface OrderItem {
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  status: string;
  paymentMethod: string;
  shippingAddress: string;
  grandTotal: number;
  createdAt: string;
  items: OrderItem[];
  storeName: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './orders.html',
})
export class OrdersComponent implements OnInit {
  private http = inject(HttpClient);
  currency = inject(CurrencyService);
  router = inject(Router);

  orders = signal<Order[]>([]);
  loading = signal(true);
  expandedId = signal<number | null>(null);

  readonly statusMeta: Record<string, { labelKey: string; icon: string; color: string; bg: string }> = {
    PENDING:    { labelKey: 'ORDERS.STATUS.PENDING',    icon: 'schedule',       color: 'text-yellow-600', bg: 'bg-yellow-50' },
    CONFIRMED:  { labelKey: 'ORDERS.STATUS.CONFIRMED',  icon: 'check_circle',   color: 'text-blue-600',   bg: 'bg-blue-50'   },
    PROCESSING: { labelKey: 'ORDERS.STATUS.PROCESSING', icon: 'inventory_2',    color: 'text-purple-600', bg: 'bg-purple-50' },
    SHIPPED:    { labelKey: 'ORDERS.STATUS.SHIPPED',    icon: 'local_shipping',  color: 'text-indigo-600', bg: 'bg-indigo-50' },
    DELIVERED:  { labelKey: 'ORDERS.STATUS.DELIVERED',  icon: 'done_all',       color: 'text-green-600',  bg: 'bg-green-50'  },
    CANCELLED:  { labelKey: 'ORDERS.STATUS.CANCELLED',  icon: 'cancel',         color: 'text-red-600',    bg: 'bg-red-50'    },
  };

  ngOnInit() {
    this.http.get<{ content: Order[] }>(`${environment.apiUrl}/orders/my`).subscribe({
      next: (page) => { this.orders.set(page.content); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleExpand(id: number) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  statusFor(status: string) {
    return this.statusMeta[status] ?? { labelKey: status, icon: 'help', color: 'text-outline', bg: 'bg-surface-container-low' };
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  getItemImg(productId: number, name: string): string {
    const kw = name.split(' ').slice(0, 2).join(',');
    return `https://loremflickr.com/112/112/${encodeURIComponent(kw)}?lock=${productId}`;
  }

  onItemImgError(event: Event, productId: number): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = `https://loremflickr.com/112/112/product?lock=${productId}`;
  }

  paymentLabelKey(method: string): string {
    const map: Record<string, string> = {
      CREDIT_CARD:      'ORDERS.CREDIT_CARD',
      DEBIT_CARD:       'ORDERS.DEBIT_CARD',
      CASH_ON_DELIVERY: 'CART.CASH_ON_DELIVERY',
      BANK_TRANSFER:    'CART.BANK_TRANSFER',
      CRYPTO_WALLET:    'CART.CRYPTO_WALLET',
    };
    if (method.startsWith('STRIPE'))       return 'ORDERS.CREDIT_CARD';
    if (method.startsWith('CRYPTO_WALLET')) return 'CART.CRYPTO_WALLET';
    if (method.startsWith('PAYPAL'))        return 'PayPal';
    return map[method] ?? method;
  }
}
