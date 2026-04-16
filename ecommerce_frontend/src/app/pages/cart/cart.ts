import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../services/cart.service';
import { CurrencyService } from '../../services/currency.service';
import { AddressService, UserAddress } from '../../services/address.service';
import { PaymentMethodService, SavedPaymentMethod } from '../../services/payment-method.service';
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
  icon: string; // data URI supplied by the wallet extension
}

interface EIP6963ProviderDetail {
  info:     EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

declare global {
  interface Window { ethereum?: EIP1193Provider; }
}

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
export class CartComponent implements OnInit {
  cartService    = inject(CartService);
  currency       = inject(CurrencyService);
  private router = inject(Router);
  private addressService = inject(AddressService);
  private paymentMethodService = inject(PaymentMethodService);

  loading         = signal(true);
  checkingOut     = signal(false);
  checkoutError   = signal('');
  checkoutSuccess = signal(false);

  // ─── Address selection ────────────────────────────────────
  savedAddresses    = signal<UserAddress[]>([]);
  selectedAddressId = signal<number | null>(null);
  manualAddress     = '';
  useManualAddress  = signal(false);

  get shippingAddress(): string {
    if (this.useManualAddress()) return this.manualAddress;
    const addr = this.savedAddresses().find(a => a.id === this.selectedAddressId());
    if (!addr) return '';
    return [addr.fullAddress, addr.district, addr.city, addr.postalCode, addr.phone]
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
      if (saved.type === 'STRIPE')  return `STRIPE:${saved.cardBrand ?? ''}:${saved.cardLast4 ?? ''}`.replace(/:+$/, '');
      if (saved.type === 'PAYPAL')  return `PAYPAL:${saved.paypalEmail ?? saved.label}`;
      if (saved.type === 'CRYPTO')  return `CRYPTO_WALLET:${this.walletAddress() ?? saved.walletAddress ?? ''}`;
    }
    return this.paymentMethod;
  }

  // ─── Payment method ───────────────────────────────────────
  paymentMethod = '';

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
  walletChainId    = signal<string | null>(null);   // human-readable name
  currentChainId   = signal<number>(1);             // numeric ID
  activeProvider   = signal<EIP6963ProviderDetail | null>(null);

  // ─── On-chain payment state ───────────────────────────────
  cryptoAmount = signal<number>(0);   // amount to send in native token
  txHash       = signal<string | null>(null);
  txStatus     = signal<TxStatus>('idle');
  txError      = signal('');

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
        const def = list.find(a => a.isDefault);
        if (def) this.selectedAddressId.set(def.id);
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

  selectAddress(id: number) {
    this.selectedAddressId.set(id);
    this.useManualAddress.set(false);
  }

  switchToManual() {
    this.selectedAddressId.set(null);
    this.useManualAddress.set(true);
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

      // Reset tx state on wallet change
      this.txHash.set(null);
      this.txStatus.set('idle');
      this.txError.set('');

      // Sync address if user switches account inside the extension
      detail.provider.on('accountsChanged', (accs: unknown) => {
        this.walletAddress.set((accs as string[])[0] ?? null);
      });

      // Fetch how much crypto the user needs to send
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

    // Sepolia testnet: use a tiny fixed amount for testing
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
        // 6 decimal places → enough precision for any EVM chain
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
      // Convert native token amount to Wei (hex) — use BigInt for precision
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

      // Poll for receipt — up to 3 minutes (60 × 3 s)
      await this.waitForReceipt(provider, hash);

      this.txStatus.set('confirmed');

      // Backend: verify on-chain + create order
      const paymentInfo = `CRYPTO_WALLET:${this.walletAddress()}`;
      this.checkingOut.set(true);
      this.cartService
        .checkout(paymentInfo, shippingAddr, hash, this.currentChainId())
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

  /** Poll eth_getTransactionReceipt until mined (max ~3 min) */
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

    const pmString = this.effectivePaymentMethodString;
    if (!pmString) { this.checkoutError.set('Ödeme yöntemi seçiniz.'); return; }

    this.checkingOut.set(true);
    this.checkoutError.set('');
    this.cartService.checkout(pmString, addr).subscribe({
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

  goShopping() {
    this.router.navigate(['/app/products']);
  }
}
