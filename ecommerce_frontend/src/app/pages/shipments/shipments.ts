import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../enviroments/enviroments';

export interface ShipmentItem {
  id: number;
  orderId: number;
  trackingNumber: string;
  carrier: string;
  modeOfShipment: string;
  status: string;
  estimatedDelivery: string;
  deliveredAt: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './shipments.html',
})
export class ShipmentsComponent implements OnInit {
  private http = inject(HttpClient);
  router = inject(Router);

  shipments = signal<ShipmentItem[]>([]);
  loading = signal(true);

  trackInput = '';
  trackResult = signal<ShipmentItem | null>(null);
  trackError = signal('');
  trackLoading = signal(false);

  readonly statusMeta: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    PENDING:     { label: 'Bekliyor',    icon: 'schedule',        color: 'text-yellow-600', bg: 'bg-yellow-50' },
    PROCESSING:  { label: 'İşlemde',     icon: 'inventory_2',     color: 'text-purple-600', bg: 'bg-purple-50' },
    SHIPPED:     { label: 'Kargoda',     icon: 'local_shipping',  color: 'text-blue-600',   bg: 'bg-blue-50'   },
    IN_TRANSIT:  { label: 'Yolda',       icon: 'directions_car',  color: 'text-indigo-600', bg: 'bg-indigo-50' },
    OUT_FOR_DELIVERY: { label: 'Dağıtımda', icon: 'delivery_dining', color: 'text-orange-600', bg: 'bg-orange-50' },
    DELIVERED:   { label: 'Teslim Edildi', icon: 'done_all',      color: 'text-green-600',  bg: 'bg-green-50'  },
    RETURNED:    { label: 'İade',         icon: 'keyboard_return', color: 'text-red-600',   bg: 'bg-red-50'    },
    CANCELLED:   { label: 'İptal',        icon: 'cancel',         color: 'text-red-600',    bg: 'bg-red-50'    },
  };

  ngOnInit() {
    this.http.get<{ content: ShipmentItem[] }>(`${environment.apiUrl}/shipments/my`).subscribe({
      next: (page) => { this.shipments.set(page.content); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusFor(status: string) {
    return this.statusMeta[status] ?? { label: status, icon: 'help', color: 'text-outline', bg: 'bg-surface-container-low' };
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  trackShipment() {
    const code = this.trackInput.trim();
    if (!code) return;
    this.trackLoading.set(true);
    this.trackError.set('');
    this.trackResult.set(null);
    this.http.get<ShipmentItem>(`${environment.apiUrl}/shipments/track/${code}`).subscribe({
      next: (s) => { this.trackResult.set(s); this.trackLoading.set(false); },
      error: () => { this.trackError.set('Kargo bulunamadı. Takip numarasını kontrol edin.'); this.trackLoading.set(false); },
    });
  }
}
