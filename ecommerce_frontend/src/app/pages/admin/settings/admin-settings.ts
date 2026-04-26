import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyService } from '../../../services/currency.service';
import { environment } from '../../../../enviroments/enviroments';

interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  requireEmailVerification: boolean;
  maxOrdersPerUser: number;
  platformCurrency: string;
  supportEmail: string;
  platformName: string;
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './admin-settings.html',
})
export class AdminSettingsComponent implements OnInit {
  private http = inject(HttpClient);
  currency = inject(CurrencyService);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  error = signal('');

  settings = signal<SystemSettings>({
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    maxOrdersPerUser: 50,
    platformCurrency: 'USD',
    supportEmail: 'support@zorlukurt.com',
    platformName: 'ZorluKurt Trading',
  });

  readonly currencies = [
    { code: 'USD', label: 'US Dollar ($)' },
    { code: 'EUR', label: 'Euro (€)' },
    { code: 'GBP', label: 'British Pound (£)' },
    { code: 'TRY', label: 'Turkish Lira (₺)' },
    { code: 'JPY', label: 'Japanese Yen (¥)' },
  ];

  ngOnInit() {
    this.http.get<SystemSettings>(`${environment.apiUrl}/admin/settings`).subscribe({
      next: (s) => { this.settings.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  update<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    this.settings.update(s => ({ ...s, [key]: value }));
  }

  saveSettings() {
    this.saving.set(true);
    this.saved.set(false);
    this.error.set('');
    this.http.put<SystemSettings>(`${environment.apiUrl}/admin/settings`, this.settings()).subscribe({
      next: (s) => {
        this.settings.set(s);
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Ayarlar kaydedilemedi.');
      },
    });
  }

  resetDefaults() {
    this.settings.set({
      maintenanceMode: false,
      allowRegistrations: true,
      requireEmailVerification: true,
      maxOrdersPerUser: 50,
      platformCurrency: 'USD',
      supportEmail: 'support@zorlukurt.com',
      platformName: 'ZorluKurt Trading',
    });
  }
}
