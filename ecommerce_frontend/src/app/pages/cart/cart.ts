import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { CurrencyService } from '../../services/currency.service';
import { AddressService, UserAddress, UserAddressRequest } from '../../services/address.service';
import { PaymentMethodService, SavedPaymentMethod } from '../../services/payment-method.service';
import { getProductImage } from '../../services/product.service';
import { environment } from '../../../enviroments/enviroments';

// ─── EIP-6963: Multi-wallet discovery standard ────────────────────────────────
interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface EIP6963ProviderInfo {
  rdns: string;
  uuid: string;
  name: string;
  icon: string;
}

interface EIP6963ProviderDetail {
  info:     EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

declare global {
  interface Window { ethereum?: EIP1193Provider; }
}

// ─── Stripe global (loaded via CDN in index.html) ─────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const Stripe: ((key: string) => any) | undefined;
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Well-known wallets shown as install suggestions ──────────────────────────
const POPULAR_WALLETS = [
  { rdns: 'io.metamask',         name: 'MetaMask',       color: '#E2761B', installUrl: 'https://metamask.io/download/' },
  { rdns: 'com.coinbase.wallet', name: 'Coinbase Wallet', color: '#0052FF', installUrl: 'https://www.coinbase.com/wallet/downloads' },
  { rdns: 'io.rabby',            name: 'Rabby',           color: '#8697FF', installUrl: 'https://rabby.io/' },
  { rdns: 'com.trustwallet.app', name: 'Trust Wallet',   color: '#3375BB', installUrl: 'https://trustwallet.com/browser-extension' },
  { rdns: 'io.phantom',          name: 'Phantom',         color: '#AB9FF2', installUrl: 'https://phantom.app/download' },
  { rdns: 'io.zerion.wallet',    name: 'Zerion',          color: '#2962EF', installUrl: 'https://zerion.io/extension' },
];

// Native coin symbol per EVM chain
const COIN_SYMBOLS: Record<number, string> = {
  1: 'ETH', 137: 'MATIC', 56: 'BNB', 43114: 'AVAX',
  42161: 'ETH', 10: 'ETH', 8453: 'ETH', 11155111: 'ETH',
};

// CoinGecko ID per chain for price lookup
const COINGECKO_IDS: Record<number, string> = {
  1: 'ethereum', 137: 'matic-network', 56: 'binancecoin', 43114: 'avalanche-2',
  42161: 'ethereum', 10: 'ethereum', 8453: 'ethereum', 11155111: 'ethereum',
};

type TxStatus = 'idle' | 'fetching-price' | 'sending' | 'mining' | 'confirmed' | 'error';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './cart.html',
})
export class CartComponent implements OnInit, OnDestroy {
  cartService    = inject(CartService);
  currency       = inject(CurrencyService);
  private router = inject(Router);
  http           = inject(HttpClient);
  private addressService = inject(AddressService);
  private paymentMethodService = inject(PaymentMethodService);

  loading         = signal(true);
  checkingOut     = signal(false);
  checkoutError   = signal('');
  checkoutSuccess = signal(false);

  // ─── Address selection (BehaviorSubject ile senkronize) ──
  savedAddresses    = signal<UserAddress[]>([]);
  selectedAddressId = signal<number | null>(null);

  // Yeni adres formu modal
  showAddressModal  = signal(false);
  addingAddress     = signal(false);
  newAddrTitle      = '';
  newAddrFullAddress = '';
  newAddrCity       = '';
  newAddrDistrict   = '';
  newAddrPostalCode = '';
  addressFormError  = signal('');

  get shippingAddress(): string {
    const addr = this.addressService.getSelectedAddress();
    if (!addr) return '';
    return [addr.fullAddress, addr.district, addr.city, addr.postalCode]
      .filter(Boolean).join(', ');
  }

  // ─── Saved payment methods (from profile) ────────────────
  savedPaymentMethods = signal<SavedPaymentMethod[]>([]);
  selectedSavedPaymentId = signal<number | null>(null);

  get selectedSavedPayment(): SavedPaymentMethod | null {
    return this.savedPaymentMethods().find(m => m.id === this.selectedSavedPaymentId()) ?? null;
  }

  selectSavedPayment(method: SavedPaymentMethod) {
    this.selectedSavedPaymentId.set(method.id);
    this.paymentMethod = '';
    if (method.type === 'CRYPTO') this.discoverWallets();
  }

  savedPaymentIcon(type: string): string {
    return ({ STRIPE: 'credit_card', PAYPAL: 'account_balance_wallet', CRYPTO: 'currency_bitcoin' } as Record<string, string>)[type] ?? 'payments';
  }

  savedPaymentSummary(pm: SavedPaymentMethod): string {
    if (pm.type === 'STRIPE') return pm.cardBrand ? `${pm.cardBrand} ···· ${pm.cardLast4 ?? ''}` : pm.label;
    if (pm.type === 'PAYPAL') return pm.paypalEmail ?? pm.label;
    if (pm.type === 'CRYPTO') return pm.walletAddress ? pm.walletAddress.slice(0, 8) + '...' + pm.walletAddress.slice(-6) : pm.label;
    return pm.label;
  }

  get effectivePaymentMethodString(): string {
    const saved = this.selectedSavedPayment;
    if (saved) {
      if (saved.type === 'STRIPE')  return `STRIPE:${saved.stripePaymentMethodId ?? saved.cardBrand ?? ''}:${saved.cardLast4 ?? ''}`.replace(/:+$/, '');
      if (saved.type === 'PAYPAL')  return `PAYPAL:${saved.paypalEmail ?? saved.label}`;
      if (saved.type === 'CRYPTO')  return `CRYPTO_WALLET:${this.walletAddress() ?? saved.walletAddress ?? ''}`;
    }
    return this.paymentMethod;
  }

  // ─── Payment method ───────────────────────────────────────
  paymentMethod = '';
  showAddPaymentPrompt = signal(false);
  promptPaymentType = signal('');

  get savedStripeMethod(): SavedPaymentMethod | null {
    return this.savedPaymentMethods().find(m => m.type === 'STRIPE') ?? null;
  }

  get savedPaypalMethod(): SavedPaymentMethod | null {
    return this.savedPaymentMethods().find(m => m.type === 'PAYPAL') ?? null;
  }

  get savedCryptoMethod(): SavedPaymentMethod | null {
    return this.savedPaymentMethods().find(m => m.type === 'CRYPTO') ?? null;
  }

  isTypeSelected(type: string): boolean {
    const saved = this.selectedSavedPayment;
    if (saved) {
      if (type === 'CREDIT_CARD') return saved.type === 'STRIPE';
      if (type === 'PAYPAL')      return saved.type === 'PAYPAL';
      if (type === 'CRYPTO_WALLET') return saved.type === 'CRYPTO';
      return false;
    }
    return this.paymentMethod === type;
  }

  // ─── Stripe Elements ──────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stripeInstance = signal<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stripeCardEl   = signal<any>(null);
  stripeReady    = signal(false);
  stripeError    = signal('');

  async initStripe() {
    if (typeof Stripe === 'undefined') return;
    const key = environment.stripePublishableKey;
    if (!key || key.startsWith('pk_test_XXXX')) return;
    try {
      const stripe   = Stripe(key);
      const elements = stripe.elements();
      const card = elements.create('card', {
        style: {
          base: {
            color: '#1a1b22',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '14px',
            '::placeholder': { color: '#89898f' },
          },
          invalid: { color: '#ef4444' },
        },
      });
      this.stripeInstance.set(stripe);
      this.stripeCardEl.set(card);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      card.on('change', (event: any) => {
        this.stripeError.set(event.error?.message ?? '');
      });
      setTimeout(() => {
        const el = document.getElementById('stripe-card-element');
        if (el) { card.mount('#stripe-card-element'); this.stripeReady.set(true); }
      }, 150);
    } catch { /* Stripe SDK unavailable */ }
  }

  async checkoutWithStripe(addr: string) {
    const stripe = this.stripeInstance();
    const card   = this.stripeCardEl();
    if (!stripe || !card) { this.checkoutError.set('Stripe yüklenemedi.'); return; }

    this.checkingOut.set(true);
    this.checkoutError.set('');
    this.stripeError.set('');

    const result = await stripe.createPaymentMethod({ type: 'card', card });
    if (result.error) {
      this.stripeError.set(result.error.message ?? 'Kart doğrulanamadı.');
      this.checkingOut.set(false);
      return;
    }

    const pmId = result.paymentMethod.id as string;
    this.cartService
      .checkout(`STRIPE_PM:${pmId}`, addr, undefined, undefined, this.couponApplied() ? this.couponCode : undefined)
      .subscribe({
        next: () => {
          this.checkingOut.set(false);
          this.checkoutSuccess.set(true);
          this.cartService.resetCart();
          setTimeout(() => this.router.navigate(['/app/orders']), 2000);
        },
        error: (err) => {
          this.checkingOut.set(false);
          this.checkoutError.set(err?.error?.message ?? 'Ödeme tamamlanamadı.');
        },
      });
  }

  // ─── PayPal ───────────────────────────────────────────────
  paypalReady      = signal(false);
  paypalError      = signal('');
  paypalProcessing = signal(false);

  async loadPayPal() {
    const clientId = environment.paypalClientId;
    if (!clientId || clientId === 'YOUR_PAYPAL_CLIENT_ID') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).paypal) { setTimeout(() => this.renderPayPalButtons(), 100); return; }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.onload  = () => setTimeout(() => this.renderPayPalButtons(), 100);
    script.onerror = () => this.paypalError.set('PayPal SDK yüklenemedi.');
    document.body.appendChild(script);
  }

  renderPayPalButtons() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pp = (window as any).paypal;
    if (!pp) return;
    const container = document.getElementById('paypal-button-container');
    if (!container || container.children.length > 0) return;

    pp.Buttons({
      style: { layout: 'vertical', color: 'blue', shape: 'pill', label: 'pay' },
      createOrder: async () => {
        const res = await firstValueFrom(
          this.http.post<{ id: string }>(`${environment.apiUrl}/payments/paypal/create-order`, {
            amount: this.cartService.cart()?.totalPrice ?? 0,
          })
        );
        return res.id;
      },
      onApprove: async (data: { orderID: string }) => {
        this.paypalProcessing.set(true);
        this.checkoutError.set('');
        try {
          await firstValueFrom(
            this.http.post(`${environment.apiUrl}/payments/paypal/capture`, { orderId: data.orderID })
          );
          const addr = this.shippingAddress.trim();
          if (!addr) { this.checkoutError.set('Teslimat adresi gerekli.'); this.paypalProcessing.set(false); return; }
          this.cartService
            .checkout(`PAYPAL:${data.orderID}`, addr, undefined, undefined, this.couponApplied() ? this.couponCode : undefined)
            .subscribe({
              next: () => {
                this.paypalProcessing.set(false);
                this.checkoutSuccess.set(true);
                this.cartService.resetCart();
                setTimeout(() => this.router.navigate(['/app/orders']), 2000);
              },
              error: (err) => {
                this.paypalProcessing.set(false);
                this.checkoutError.set(err?.error?.message ?? 'Sipariş tamamlanamadı.');
              },
            });
        } catch (err: unknown) {
          this.paypalProcessing.set(false);
          const e = err as { error?: { message?: string } };
          this.paypalError.set(e?.error?.message ?? 'PayPal ödemesi tamamlanamadı.');
        }
      },
      onError: (err: Error) => {
        this.paypalError.set(err.message ?? 'PayPal hatası oluştu.');
      },
    }).render('#paypal-button-container');
    this.paypalReady.set(true);
  }

  // Main Place Order button is hidden when PayPal (no saved) handles it via its own button
  get showPlaceOrderBtn(): boolean {
    return !(this.isTypeSelected('PAYPAL') && !this.savedPaypalMethod);
  }

  selectPaymentType(type: string) {
    this.showAddPaymentPrompt.set(false);
    this.promptPaymentType.set('');
    if (type === 'CREDIT_CARD') {
      const saved = this.savedStripeMethod;
      if (saved) {
        this.selectSavedPayment(saved);
      } else {
        this.selectedSavedPaymentId.set(null);
        this.paymentMethod = 'CREDIT_CARD';
        this.stripeCardEl()?.destroy();
        this.stripeCardEl.set(null);
        this.stripeReady.set(false);
        this.stripeError.set('');
        setTimeout(() => this.initStripe(), 50);
      }
    } else if (type === 'PAYPAL') {
      const saved = this.savedPaypalMethod;
      if (saved) {
        this.selectSavedPayment(saved);
      } else {
        this.selectedSavedPaymentId.set(null);
        this.paymentMethod = 'PAYPAL';
        this.paypalReady.set(false);
        this.paypalError.set('');
        setTimeout(() => this.loadPayPal(), 50);
      }
    } else if (type === 'CRYPTO_WALLET') {
      const saved = this.savedCryptoMethod;
      if (saved) { this.selectSavedPayment(saved); }
      else { this.selectedSavedPaymentId.set(null); this.paymentMethod = 'CRYPTO_WALLET'; this.discoverWallets(); }
    } else {
      this.selectedSavedPaymentId.set(null);
      this.paymentMethod = type;
    }
  }

  readonly otherPaymentOptions = [
    { value: 'CASH_ON_DELIVERY', labelKey: 'CART.CASH_ON_DELIVERY', icon: 'local_shipping' },
    { value: 'BANK_TRANSFER',    labelKey: 'CART.BANK_TRANSFER',    icon: 'account_balance' },
    { value: 'CRYPTO_WALLET',    labelKey: 'CART.CRYPTO_WALLET',    icon: 'currency_bitcoin' },
  ];

  onPaymentMethodChange(value: string) {
    this.paymentMethod = value;
    this.selectedSavedPaymentId.set(null);
    if (value === 'CRYPTO_WALLET') this.discoverWallets();
  }

  // ─── EIP-6963 wallet discovery ────────────────────────────
  discoveredWallets = signal<EIP6963ProviderDetail[]>([]);
  readonly popularWallets = POPULAR_WALLETS;

  get notInstalledWallets() {
    const installed = new Set(this.discoveredWallets().map(w => w.info.rdns));
    return this.popularWallets.filter(w => !installed.has(w.rdns));
  }

  discoverWallets() {
    if (typeof window === 'undefined') return;
    const found: EIP6963ProviderDetail[] = [...this.discoveredWallets()];
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (!found.find(w => w.info.rdns === detail.info.rdns)) {
        found.push(detail);
        this.discoveredWallets.set([...found]);
      }
    };
    window.addEventListener('eip6963:announceProvider', handler);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    setTimeout(() => window.removeEventListener('eip6963:announceProvider', handler), 600);
  }

  // ─── Wallet connection state ──────────────────────────────
  walletConnecting = signal(false);
  walletAddress    = signal<string | null>(null);
  walletError      = signal('');
  walletChainId    = signal<string | null>(null);
  currentChainId   = signal<number>(1);
  activeProvider   = signal<EIP6963ProviderDetail | null>(null);

  // ─── On-chain payment state ───────────────────────────────
  cryptoAmount = signal<number>(0);
  txHash       = signal<string | null>(null);
  txStatus     = signal<TxStatus>('idle');
  txError      = signal('');

  // ─── Coupon ───────────────────────────────────────────────
  couponCode    = '';
  couponApplied = signal(false);
  couponDiscount = signal(0);
  couponLoading = signal(false);
  couponError   = signal('');

  get coinSymbol(): string {
    return COIN_SYMBOLS[this.currentChainId()] ?? 'TOKEN';
  }

  // ─── Lifecycle ────────────────────────────────────────────
  ngOnInit() {
    this.cartService.load().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
    this.addressService.getAll().subscribe({
      next: list => {
        this.savedAddresses.set(list);
        const def = list.find(a => a.isDefault) ?? list[0] ?? null;
        if (def) {
          this.selectedAddressId.set(def.id);
          this.addressService.selectAddress(def);
        }
      },
    });
    this.paymentMethodService.getAll().subscribe({
      next: list => {
        this.savedPaymentMethods.set(list);
        const def = list.find(m => m.isDefault);
        if (def) this.selectSavedPayment(def);
        else if (list.length > 0) this.selectSavedPayment(list[0]);
        else this.paymentMethod = 'CASH_ON_DELIVERY';
      },
      error: () => { this.paymentMethod = 'CASH_ON_DELIVERY'; },
    });
    this.discoverWallets();
  }

  ngOnDestroy() {
    this.stripeCardEl()?.destroy();
  }

  selectAddress(id: number) {
    this.selectedAddressId.set(id);
    const addr = this.savedAddresses().find(a => a.id === id) ?? null;
    this.addressService.selectAddress(addr);
  }

  openAddressModal() {
    this.newAddrTitle = '';
    this.newAddrFullAddress = '';
    this.newAddrCity = '';
    this.newAddrDistrict = '';
    this.newAddrPostalCode = '';
    this.addressFormError.set('');
    this.showAddressModal.set(true);
  }

  closeAddressModal() {
    this.showAddressModal.set(false);
  }

  submitNewAddress() {
    if (!this.newAddrTitle.trim() || !this.newAddrFullAddress.trim() || !this.newAddrCity.trim()) {
      this.addressFormError.set('Başlık, adres ve şehir alanları zorunludur.');
      return;
    }
    this.addingAddress.set(true);
    this.addressFormError.set('');
    const req: UserAddressRequest = {
      title: this.newAddrTitle.trim(),
      fullAddress: this.newAddrFullAddress.trim(),
      city: this.newAddrCity.trim(),
      district: this.newAddrDistrict.trim() || undefined,
      postalCode: this.newAddrPostalCode.trim() || undefined,
      isDefault: this.savedAddresses().length === 0,
    };
    this.addressService.create(req).subscribe({
      next: (addr) => {
        this.savedAddresses.update(list => [...list, addr]);
        this.selectedAddressId.set(addr.id);
        // BehaviorSubject create() tap'inde zaten güncellendi
        this.addingAddress.set(false);
        this.showAddressModal.set(false);
      },
      error: () => {
        this.addressFormError.set('Adres kaydedilemedi. Tekrar deneyin.');
        this.addingAddress.set(false);
      },
    });
  }

  // ─── Connect wallet ───────────────────────────────────────
  async connectWallet(detail: EIP6963ProviderDetail) {
    this.walletConnecting.set(true);
    this.walletError.set('');
    try {
      const accounts = await detail.provider.request({ method: 'eth_requestAccounts' }) as string[];
      const chainHex = await detail.provider.request({ method: 'eth_chainId' }) as string;
      const chainNum = parseInt(chainHex, 16);

      this.activeProvider.set(detail);
      this.walletAddress.set(accounts[0]);
      this.currentChainId.set(chainNum);
      this.walletChainId.set(this.chainName(chainNum));

      this.txHash.set(null);
      this.txStatus.set('idle');
      this.txError.set('');

      detail.provider.on('accountsChanged', (accs: unknown) => {
        this.walletAddress.set((accs as string[])[0] ?? null);
      });

      await this.fetchCryptoAmount();
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      this.walletError.set(e.code === 4001 ? 'Bağlantı isteği reddedildi.' : (e.message ?? 'Cüzdan bağlanırken hata.'));
    } finally {
      this.walletConnecting.set(false);
    }
  }

  disconnectWallet() {
    this.walletAddress.set(null);
    this.walletChainId.set(null);
    this.walletError.set('');
    this.activeProvider.set(null);
    this.cryptoAmount.set(0);
    this.txHash.set(null);
    this.txStatus.set('idle');
    this.txError.set('');
  }

  maskWallet(addr: string): string {
    return addr.slice(0, 8) + '...' + addr.slice(-6);
  }

  private chainName(id: number): string {
    return ({
      1:        'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      137:      'Polygon',
      56:       'BNB Chain',
      43114:    'Avalanche',
      42161:    'Arbitrum One',
      10:       'Optimism',
      8453:     'Base',
    } as Record<number, string>)[id] ?? `Chain ${id}`;
  }

  // ─── Fetch native token price → calculate crypto amount ──
  async fetchCryptoAmount() {
    const total = this.cartService.cart()?.totalPrice ?? 0;
    if (!total) return;

    this.txStatus.set('fetching-price');
    this.txError.set('');

    if (this.currentChainId() === 11155111) {
      this.cryptoAmount.set(0.001);
      this.txStatus.set('idle');
      return;
    }

    try {
      const coinId = COINGECKO_IDS[this.currentChainId()] ?? 'ethereum';
      const res  = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      );
      const data = await res.json() as Record<string, { usd: number }>;
      const price = data[coinId]?.usd ?? 0;

      if (price > 0) {
        this.cryptoAmount.set(Math.ceil((total / price) * 1e6) / 1e6);
      } else {
        this.txError.set('Token fiyatı alınamadı. Sayfayı yenileyip tekrar deneyin.');
      }
    } catch {
      this.txError.set('Fiyat bilgisi alınamadı (CoinGecko). İnternet bağlantınızı kontrol edin.');
    } finally {
      if (this.txStatus() === 'fetching-price') this.txStatus.set('idle');
    }
  }

  // ─── Send on-chain transaction and wait for mining ───────
  private async sendCryptoAndCheckout(shippingAddr: string) {
    const provider = this.activeProvider();
    if (!provider || !this.walletAddress() || this.cryptoAmount() <= 0) return;

    this.txStatus.set('sending');
    this.txError.set('');
    this.checkoutError.set('');

    try {
      const weiAmount = BigInt(Math.round(this.cryptoAmount() * 1e18));
      const valueHex  = '0x' + weiAmount.toString(16);

      const hash = await provider.provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from:  this.walletAddress(),
          to:    environment.merchantWallet,
          value: valueHex,
        }],
      }) as string;

      this.txHash.set(hash);
      this.txStatus.set('mining');

      await this.waitForReceipt(provider, hash);

      this.txStatus.set('confirmed');

      const paymentInfo = `CRYPTO_WALLET:${this.walletAddress()}`;
      this.checkingOut.set(true);
      this.cartService
        .checkout(paymentInfo, shippingAddr, hash, this.currentChainId(), this.couponApplied() ? this.couponCode : undefined)
        .subscribe({
          next: () => {
            this.checkingOut.set(false);
            this.checkoutSuccess.set(true);
            this.cartService.resetCart();
            setTimeout(() => this.router.navigate(['/app/orders']), 2500);
          },
          error: (err) => {
            this.checkingOut.set(false);
            this.txStatus.set('error');
            this.txError.set(err?.error?.message ?? 'Sipariş oluşturulamadı. Desteğe başvurun.');
          },
        });

    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      this.txStatus.set('error');
      if (e.code === 4001) {
        this.txError.set('İşlem reddedildi.');
      } else if ((e.message ?? '').includes('zaman aşımı')) {
        this.txError.set('İşlem 3 dakika içinde onaylanamadı. Txhash\'i not alın ve destek ekibiyle iletişime geçin.');
      } else {
        this.txError.set(e.message ?? 'İşlem gönderilemedi.');
      }
    }
  }

  private async waitForReceipt(detail: EIP6963ProviderDetail, hash: string): Promise<void> {
    for (let i = 0; i < 60; i++) {
      const receipt = await detail.provider.request({
        method: 'eth_getTransactionReceipt',
        params: [hash],
      });
      if (receipt !== null) return;
      await new Promise(r => setTimeout(r, 3000));
    }
    throw new Error('zaman aşımı');
  }

  // ─── Cart actions ─────────────────────────────────────────
  updateQty(cartItemId: number, quantity: number) {
    if (quantity < 1) { this.removeItem(cartItemId); return; }
    this.cartService.updateItem(cartItemId, quantity).subscribe();
  }

  removeItem(cartItemId: number) {
    this.cartService.removeItem(cartItemId).subscribe();
  }

  clearCart() {
    if (!confirm('Sepeti temizlemek istiyor musunuz?')) return;
    this.cartService.clear().subscribe();
  }

  // ─── Checkout entry point ─────────────────────────────────
  checkout() {
    const addr = this.shippingAddress.trim();
    if (!addr) { this.checkoutError.set('Teslimat adresi gerekli.'); return; }

    const isCrypto = this.paymentMethod === 'CRYPTO_WALLET' || this.selectedSavedPayment?.type === 'CRYPTO';
    if (isCrypto) {
      if (!this.walletAddress()) { this.checkoutError.set('Lütfen önce kripto cüzdanınızı bağlayın.'); return; }
      if (this.cryptoAmount() <= 0) { this.checkoutError.set('Kripto fiyatı alınamadı. Lütfen bekleyin.'); return; }
      this.sendCryptoAndCheckout(addr);
      return;
    }

    // New card via Stripe Elements (no saved Stripe method)
    if (!this.savedStripeMethod && this.paymentMethod === 'CREDIT_CARD') {
      if (!this.stripeReady()) { this.checkoutError.set('Kart formu yükleniyor, lütfen bekleyin.'); return; }
      this.checkoutWithStripe(addr);
      return;
    }

    const pmString = this.effectivePaymentMethodString;
    if (!pmString) { this.checkoutError.set('Ödeme yöntemi seçiniz.'); return; }

    this.checkingOut.set(true);
    this.checkoutError.set('');
    this.cartService.checkout(pmString, addr, undefined, undefined, this.couponApplied() ? this.couponCode : undefined).subscribe({
      next: () => {
        this.checkingOut.set(false);
        this.checkoutSuccess.set(true);
        this.cartService.resetCart();
        setTimeout(() => this.router.navigate(['/app/orders']), 2000);
      },
      error: (err) => {
        this.checkingOut.set(false);
        this.checkoutError.set(err?.error?.message ?? 'Sipariş tamamlanamadı.');
      },
    });
  }

  // ─── Coupon methods ───────────────────────────────────────
  applyCoupon() {
    const code = this.couponCode.trim().toUpperCase();
    if (!code) return;
    this.couponLoading.set(true);
    this.couponError.set('');
    this.http.post<{ valid: boolean; discountAmount: number; message?: string }>(
      `${environment.apiUrl}/coupons/validate`,
      { code, total: this.cartService.cart()?.totalPrice ?? 0 }
    ).subscribe({
      next: (res) => {
        this.couponApplied.set(true);
        this.couponDiscount.set(res.discountAmount ?? 0);
        this.couponLoading.set(false);
      },
      error: (err) => {
        this.couponError.set(err?.error?.message ?? 'Geçersiz kupon kodu.');
        this.couponLoading.set(false);
      },
    });
  }

  removeCoupon() {
    this.couponCode = '';
    this.couponApplied.set(false);
    this.couponDiscount.set(0);
    this.couponError.set('');
  }

  goShopping() {
    this.router.navigate(['/app/products']);
  }

  getItemImg(imageUrl: string | null, productId: number, name: string): string {
    return getProductImage({
      id: productId, name, imageUrl,
      category: null, sku: '', description: '',
      unitPrice: 0, stockQuantity: 0, productImportance: '',
      active: true, store: { id: 0, name: '' },
      avgRating: 0, reviewCount: 0,
    }, 300);
  }

  onItemImgError(event: Event, productId: number): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = `https://loremflickr.com/300/225/product?lock=${productId}`;
  }
}
