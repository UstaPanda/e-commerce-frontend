import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroments';

export interface ExchangeRateResponse {
  rates: Record<string, number>;
  lastUpdated: string;
  rateDate: string;
}

export const SUPPORTED_CURRENCIES: { code: string; symbol: string; name: string }[] = [
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'TRY', symbol: '₺',  name: 'Türk Lirası' },
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'SAR', symbol: '﷼',  name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private rates = signal<Record<string, number>>({ USD: 1 });
  selectedCurrency = signal<string>(localStorage.getItem('currency') ?? 'USD');
  lastUpdated = signal<string>('');
  rateDate = signal<string>('');

  private intervalId?: ReturnType<typeof setInterval>;

  constructor(private http: HttpClient) {
    this.fetch();
    this.intervalId = setInterval(() => this.fetch(), 60_000);
  }

  private fetch() {
    this.http.get<ExchangeRateResponse>(`${environment.apiUrl}/exchange-rates`).subscribe({
      next: (res) => {
        this.rates.set(res.rates);
        this.lastUpdated.set(res.lastUpdated);
        this.rateDate.set(res.rateDate);
      },
      error: () => {} // fallback rates already set on backend
    });
  }

  setCurrency(code: string) {
    this.selectedCurrency.set(code);
    localStorage.setItem('currency', code);
  }

  /** USD bazlı fiyatı seçili para birimine çevirir */
  convert(usdAmount: number): number {
    const rate = this.rates()[this.selectedCurrency()] ?? 1;
    return usdAmount * rate;
  }

  /** Formatlanmış string döner: "₺1.234,56" veya "$12.34" */
  format(usdAmount: number): string {
    const code = this.selectedCurrency();
    const converted = this.convert(usdAmount);
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    const symbol = currency?.symbol ?? code;

    // Her zaman 2 ondalık hane göster (fiyat tutarlılığı için)
    const decimals = 2;

    return `${symbol}${converted.toLocaleString('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }

  get currentSymbol(): string {
    return SUPPORTED_CURRENCIES.find(c => c.code === this.selectedCurrency())?.symbol ?? '$';
  }
}
