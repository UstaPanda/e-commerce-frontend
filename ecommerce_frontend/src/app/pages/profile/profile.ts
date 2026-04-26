import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { AddressService, UserAddress, UserAddressRequest } from '../../services/address.service';
import { WishlistService, WishlistItem } from '../../services/wishlist.service';
import { CollectionService, Collection, CollectionRequest } from '../../services/collection.service';
import { PaymentMethodService, SavedPaymentMethod, SavedPaymentMethodRequest, PaymentType } from '../../services/payment-method.service';
import { environment } from '../../../enviroments/enviroments';
import { TranslateModule } from '@ngx-translate/core';

export type ProfileTab = 'info' | 'addresses' | 'wishlist' | 'collections' | 'payments' | 'accounts';

interface CustomerProfile {
  gender: string | null;
  age: number | null;
  city: string | null;
  membershipType: string;
  totalSpend: number;
  itemsPurchased: number;
  avgRating: number;
  satisfactionLevel: string | null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './profile.html',
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthService);
  currency = inject(CurrencyService);
  private http = inject(HttpClient);
  private addressService = inject(AddressService);
  private wishlistService = inject(WishlistService);
  private collectionService = inject(CollectionService);
  private paymentMethodService = inject(PaymentMethodService);

  user = this.auth.currentUser;
  isCorporate = this.auth.getRole() === 'CORPORATE';
  activeTab = signal<ProfileTab>(this.isCorporate ? 'info' : 'info');

  // ─── Profile info ──────────────────────────────────────────
  profile = signal<CustomerProfile | null>(null);
  loadingProfile = signal(true);
  editingInfo = signal(false);
  savingInfo = signal(false);

  editName = '';
  editGender = '';
  editAge: number | null = null;
  editCity = '';
  editSatisfaction = '';

  // ─── Addresses ────────────────────────────────────────────
  addresses = signal<UserAddress[]>([]);
  loadingAddresses = signal(true);
  showAddressForm = signal(false);
  editingAddressId = signal<number | null>(null);
  savingAddress = signal(false);
  deletingAddressId = signal<number | null>(null);

  formTitle = '';
  formFullAddress = '';
  formCity = '';
  formDistrict = '';
  formPostalCode = '';
  formIsDefault = false;

  // ─── Wishlist ──────────────────────────────────────────────
  wishlist = signal<WishlistItem[]>([]);
  loadingWishlist = signal(false);
  removingWishlistId = signal<number | null>(null);

  // ─── Collections ──────────────────────────────────────────
  collections = signal<Collection[]>([]);
  loadingCollections = signal(false);
  selectedCollection = signal<Collection | null>(null);
  showCollectionForm = signal(false);
  editingCollectionId = signal<number | null>(null);
  savingCollection = signal(false);
  deletingCollectionId = signal<number | null>(null);

  collectionFormName = '';
  collectionFormDesc = '';

  // ─── Payment Methods (bireysel) ────────────────────────────
  paymentMethods = signal<SavedPaymentMethod[]>([]);
  loadingPayments = signal(false);
  showPaymentForm = signal(false);
  savingPayment = signal(false);
  deletingPaymentId = signal<number | null>(null);

  pmFormType: PaymentType = 'STRIPE';
  pmFormLabel = '';
  pmFormCardLast4 = '';
  pmFormCardBrand = '';
  pmFormStripeId = '';
  pmFormPaypalEmail = '';
  pmFormWalletAddress = '';
  pmFormChainId: number | null = null;
  pmFormChainName = '';
  pmFormIsDefault = false;

  // ─── Alacak Hesapları (corporate) ─────────────────────────
  // Her ödeme türü için ayrı hesap: STRIPE, PAYPAL, CRYPTO
  receivingAccounts = signal<SavedPaymentMethod[]>([]);
  loadingAccounts = signal(false);
  activeAccountType = signal<PaymentType>('STRIPE');
  showAccountForm = signal(false);
  savingAccount = signal(false);
  deletingAccountId = signal<number | null>(null);

  // Stripe alacak hesabı
  stripeAccountId = '';
  stripeAccountLabel = '';
  // PayPal alacak hesabı
  paypalReceiveEmail = '';
  paypalAccountLabel = '';
  // Kripto cüzdan
  cryptoWalletAddress = '';
  cryptoChainId: number | null = null;
  cryptoChainName = '';
  cryptoWalletLabel = '';

  readonly accountTypeOptions: { value: PaymentType; labelKey: string; icon: string; descKey: string }[] = [
    { value: 'STRIPE',  labelKey: 'PROFILE.ACCOUNT_TYPE_STRIPE',  icon: 'credit_card',            descKey: 'PROFILE.ACCOUNT_TYPE_STRIPE_DESC' },
    { value: 'PAYPAL',  labelKey: 'PROFILE.ACCOUNT_TYPE_PAYPAL',  icon: 'account_balance_wallet', descKey: 'PROFILE.ACCOUNT_TYPE_PAYPAL_DESC' },
    { value: 'CRYPTO',  labelKey: 'PROFILE.ACCOUNT_TYPE_CRYPTO',  icon: 'currency_bitcoin',       descKey: 'PROFILE.ACCOUNT_TYPE_CRYPTO_DESC' },
  ];

  readonly paymentTypeOptions: { value: PaymentType; labelKey: string; icon: string }[] = [
    { value: 'STRIPE',  labelKey: 'PROFILE.PAYMENT_TYPE_STRIPE', icon: 'credit_card' },
    { value: 'CRYPTO',  labelKey: 'PROFILE.PAYMENT_TYPE_CRYPTO', icon: 'currency_bitcoin' },
  ];

  readonly individualTabs: { id: ProfileTab; labelKey: string; icon: string }[] = [
    { id: 'info',        labelKey: 'PROFILE.TABS.INFO',        icon: 'person' },
    { id: 'addresses',   labelKey: 'PROFILE.TABS.ADDRESSES',   icon: 'location_on' },
    { id: 'wishlist',    labelKey: 'PROFILE.TABS.WISHLIST',    icon: 'favorite' },
    { id: 'collections', labelKey: 'PROFILE.TABS.COLLECTIONS', icon: 'collections_bookmark' },
    { id: 'payments',    labelKey: 'PROFILE.TABS.PAYMENTS',    icon: 'credit_card' },
  ];

  readonly corporateTabs: { id: ProfileTab; labelKey: string; icon: string }[] = [
    { id: 'info',     labelKey: 'PROFILE.TABS.INFO',     icon: 'person' },
    { id: 'accounts', labelKey: 'PROFILE.TABS.ACCOUNTS', icon: 'account_balance' },
  ];

  get tabs() {
    return this.isCorporate ? this.corporateTabs : this.individualTabs;
  }

  readonly genderOptions = ['Erkek', 'Kadın', 'Belirtmek istemiyorum'];
  readonly satisfactionOptions = ['Çok Memnun', 'Memnun', 'Orta', 'Memnun Değil'];

  readonly membershipMeta: Record<string, { label: string; color: string; icon: string }> = {
    BRONZE:   { label: 'Bronze',   color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',  icon: '🥉' },
    SILVER:   { label: 'Silver',   color: 'text-gray-300  bg-gray-500/10  border-gray-500/20',      icon: '🥈' },
    GOLD:     { label: 'Gold',     color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',  icon: '🥇' },
    PLATINUM: { label: 'Platinum', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',  icon: '💎' },
  };

  ngOnInit() {
    this.loadProfile();
    if (!this.isCorporate) {
      this.loadAddresses();
    }
    if (this.isCorporate) {
      this.loadReceivingAccounts();
    }
  }

  setTab(tab: ProfileTab) {
    this.activeTab.set(tab);
    if (tab === 'wishlist'    && this.wishlist().length === 0)     this.loadWishlist();
    if (tab === 'collections' && this.collections().length === 0)  this.loadCollections();
    if (tab === 'payments'    && this.paymentMethods().length === 0) this.loadPaymentMethods();
    if (tab === 'accounts'    && this.receivingAccounts().length === 0) this.loadReceivingAccounts();
  }

  // ─── Profile ──────────────────────────────────────────────
  loadProfile() {
    this.loadingProfile.set(true);
    this.http.get<CustomerProfile>(`${environment.apiUrl}/profile/me`).subscribe({
      next: p => { this.profile.set(p); this.loadingProfile.set(false); },
      error: ()  => this.loadingProfile.set(false),
    });
  }

  startEditInfo() {
    const p = this.profile();
    this.editName        = this.user()?.name ?? '';
    this.editGender      = p?.gender ?? '';
    this.editAge         = p?.age ?? null;
    this.editCity        = p?.city ?? '';
    this.editSatisfaction = p?.satisfactionLevel ?? '';
    this.editingInfo.set(true);
  }

  cancelEditInfo() { this.editingInfo.set(false); }

  saveInfo() {
    this.savingInfo.set(true);
    const body = {
      gender: this.editGender || null,
      age: this.editAge,
      city: this.editCity || null,
      satisfactionLevel: this.editSatisfaction || null,
    };
    this.http.put<CustomerProfile>(`${environment.apiUrl}/profile/me`, body).subscribe({
      next: p => { this.profile.set(p); this.savingInfo.set(false); this.editingInfo.set(false); },
      error: () => this.savingInfo.set(false),
    });
  }

  membershipInfo(type: string) {
    return this.membershipMeta[type] ?? this.membershipMeta['BRONZE'];
  }

  // ─── Addresses ────────────────────────────────────────────
  loadAddresses() {
    this.loadingAddresses.set(true);
    this.addressService.getAll().subscribe({
      next: list => { this.addresses.set(list); this.loadingAddresses.set(false); },
      error: ()   => this.loadingAddresses.set(false),
    });
  }

  openAddForm() { this.resetAddressForm(); this.editingAddressId.set(null); this.showAddressForm.set(true); }

  openEditForm(addr: UserAddress) {
    this.formTitle       = addr.title;
    this.formFullAddress = addr.fullAddress;
    this.formCity        = addr.city;
    this.formDistrict    = addr.district ?? '';
    this.formPostalCode  = addr.postalCode ?? '';
    this.formIsDefault   = addr.isDefault;
    this.editingAddressId.set(addr.id);
    this.showAddressForm.set(true);
  }

  cancelAddressForm() { this.showAddressForm.set(false); this.editingAddressId.set(null); this.resetAddressForm(); }

  saveAddress() {
    this.savingAddress.set(true);
    const req: UserAddressRequest = {
      title: this.formTitle, fullAddress: this.formFullAddress, city: this.formCity,
      district: this.formDistrict || undefined, postalCode: this.formPostalCode || undefined,
      isDefault: this.formIsDefault,
    };
    const editId = this.editingAddressId();
    const op = editId ? this.addressService.update(editId, req) : this.addressService.create(req);
    op.subscribe({
      next: () => { this.loadAddresses(); this.cancelAddressForm(); this.savingAddress.set(false); },
      error: () => this.savingAddress.set(false),
    });
  }

  deleteAddress(id: number) {
    if (!confirm('Bu adresi silmek istediğinize emin misiniz?')) return;
    this.deletingAddressId.set(id);
    this.addressService.delete(id).subscribe({
      next: () => { this.addresses.update(arr => arr.filter(a => a.id !== id)); this.deletingAddressId.set(null); },
      error: () => this.deletingAddressId.set(null),
    });
  }

  setDefaultAddress(id: number) {
    this.addressService.setDefault(id).subscribe({ next: () => this.loadAddresses() });
  }

  private resetAddressForm() {
    this.formTitle = ''; this.formFullAddress = ''; this.formCity = '';
    this.formDistrict = ''; this.formPostalCode = ''; this.formIsDefault = false;
  }

  get formValid(): boolean {
    return !!(this.formTitle.trim() && this.formFullAddress.trim() && this.formCity.trim());
  }

  // ─── Wishlist ──────────────────────────────────────────────
  loadWishlist() {
    this.loadingWishlist.set(true);
    this.wishlistService.getAll().subscribe({
      next: items => { this.wishlist.set(items); this.loadingWishlist.set(false); },
      error: ()    => this.loadingWishlist.set(false),
    });
  }

  removeFromWishlist(productId: number) {
    this.removingWishlistId.set(productId);
    this.wishlistService.remove(productId).subscribe({
      next: () => { this.wishlist.update(arr => arr.filter(w => w.productId !== productId)); this.removingWishlistId.set(null); },
      error: () => this.removingWishlistId.set(null),
    });
  }

  // ─── Collections ──────────────────────────────────────────
  loadCollections() {
    this.loadingCollections.set(true);
    this.collectionService.getAll().subscribe({
      next: cols => { this.collections.set(cols); this.loadingCollections.set(false); },
      error: ()   => this.loadingCollections.set(false),
    });
  }

  openCollection(col: Collection) {
    this.loadingCollections.set(true);
    this.collectionService.getDetail(col.id).subscribe({
      next: detail => { this.selectedCollection.set(detail); this.loadingCollections.set(false); },
      error: ()     => this.loadingCollections.set(false),
    });
  }

  backToCollections() { this.selectedCollection.set(null); }

  openNewCollection() { this.collectionFormName = ''; this.collectionFormDesc = ''; this.editingCollectionId.set(null); this.showCollectionForm.set(true); }

  openEditCollection(col: Collection) {
    this.collectionFormName = col.name;
    this.collectionFormDesc = col.description ?? '';
    this.editingCollectionId.set(col.id);
    this.showCollectionForm.set(true);
  }

  cancelCollectionForm() { this.showCollectionForm.set(false); this.editingCollectionId.set(null); }

  saveCollection() {
    if (!this.collectionFormName.trim()) return;
    this.savingCollection.set(true);
    const req: CollectionRequest = { name: this.collectionFormName.trim(), description: this.collectionFormDesc.trim() || undefined };
    const editId = this.editingCollectionId();
    const op = editId ? this.collectionService.update(editId, req) : this.collectionService.create(req);
    op.subscribe({
      next: () => { this.loadCollections(); this.cancelCollectionForm(); this.savingCollection.set(false); },
      error: ()  => this.savingCollection.set(false),
    });
  }

  deleteCollection(id: number) {
    if (!confirm('Bu koleksiyonu silmek istediğinize emin misiniz?')) return;
    this.deletingCollectionId.set(id);
    this.collectionService.delete(id).subscribe({
      next: () => { this.collections.update(arr => arr.filter(c => c.id !== id)); this.deletingCollectionId.set(null); if (this.selectedCollection()?.id === id) this.selectedCollection.set(null); },
      error: () => this.deletingCollectionId.set(null),
    });
  }

  removeFromCollection(collectionId: number, productId: number) {
    this.collectionService.removeProduct(collectionId, productId).subscribe({
      next: updated => {
        this.selectedCollection.set(updated);
        this.collections.update(arr => arr.map(c => c.id === collectionId ? { ...c, itemCount: updated.itemCount } : c));
      },
    });
  }

  // ─── Payment Methods (bireysel) ────────────────────────────
  loadPaymentMethods() {
    this.loadingPayments.set(true);
    this.paymentMethodService.getAll().subscribe({
      next: list => { this.paymentMethods.set(list); this.loadingPayments.set(false); },
      error: ()   => this.loadingPayments.set(false),
    });
  }

  openAddPayment() { this.resetPaymentForm(); this.showPaymentForm.set(true); }
  cancelPaymentForm() { this.showPaymentForm.set(false); this.resetPaymentForm(); }

  savePaymentMethod() {
    if (!this.pmFormLabel.trim()) return;
    this.savingPayment.set(true);
    const req: SavedPaymentMethodRequest = {
      type: this.pmFormType,
      label: this.pmFormLabel.trim(),
      cardLast4: this.pmFormCardLast4 || undefined,
      cardBrand: this.pmFormCardBrand || undefined,
      stripePaymentMethodId: this.pmFormStripeId || undefined,
      paypalEmail: this.pmFormPaypalEmail || undefined,
      walletAddress: this.pmFormWalletAddress || undefined,
      chainId: this.pmFormChainId ?? undefined,
      chainName: this.pmFormChainName || undefined,
      isDefault: this.pmFormIsDefault,
    };
    this.paymentMethodService.add(req).subscribe({
      next: () => { this.loadPaymentMethods(); this.cancelPaymentForm(); this.savingPayment.set(false); },
      error: () => this.savingPayment.set(false),
    });
  }

  deletePaymentMethod(id: number) {
    if (!confirm('Bu ödeme yöntemini silmek istiyor musunuz?')) return;
    this.deletingPaymentId.set(id);
    this.paymentMethodService.delete(id).subscribe({
      next: () => { this.paymentMethods.update(arr => arr.filter(p => p.id !== id)); this.deletingPaymentId.set(null); },
      error: () => this.deletingPaymentId.set(null),
    });
  }

  setDefaultPayment(id: number) {
    this.paymentMethodService.setDefault(id).subscribe({ next: () => this.loadPaymentMethods() });
  }

  paymentIcon(type: PaymentType): string {
    return { STRIPE: 'credit_card', PAYPAL: 'account_balance_wallet', CRYPTO: 'currency_bitcoin' }[type];
  }

  paymentSummary(pm: SavedPaymentMethod): string {
    if (pm.type === 'STRIPE') return pm.cardBrand ? `${pm.cardBrand} ···· ${pm.cardLast4 ?? ''}` : pm.label;
    if (pm.type === 'PAYPAL') return pm.paypalEmail ?? pm.label;
    if (pm.type === 'CRYPTO') return pm.walletAddress ? pm.walletAddress.slice(0, 8) + '...' + pm.walletAddress.slice(-6) : pm.label;
    return pm.label;
  }

  private resetPaymentForm() {
    this.pmFormType = 'STRIPE'; this.pmFormLabel = ''; this.pmFormCardLast4 = '';
    this.pmFormCardBrand = ''; this.pmFormStripeId = ''; this.pmFormPaypalEmail = '';
    this.pmFormWalletAddress = ''; this.pmFormChainId = null; this.pmFormChainName = '';
    this.pmFormIsDefault = false;
  }

  // ─── Alacak Hesapları (corporate) ─────────────────────────
  loadReceivingAccounts() {
    this.loadingAccounts.set(true);
    this.paymentMethodService.getAll().subscribe({
      next: list => { this.receivingAccounts.set(list); this.loadingAccounts.set(false); },
      error: ()   => this.loadingAccounts.set(false),
    });
  }

  openAccountForm(type: PaymentType) {
    this.activeAccountType.set(type);
    this.resetAccountForm();
    this.showAccountForm.set(true);
  }

  closeAccountForm() {
    this.showAccountForm.set(false);
    this.savingAccount.set(false);
    this.resetAccountForm();
  }

  saveReceivingAccount() {
    const type = this.activeAccountType();
    let req: SavedPaymentMethodRequest;

    if (type === 'STRIPE') {
      if (!this.stripeAccountLabel.trim() || !this.stripeAccountId.trim()) return;
      req = { type: 'STRIPE', label: this.stripeAccountLabel.trim(), stripePaymentMethodId: this.stripeAccountId.trim(), isDefault: true };
    } else if (type === 'PAYPAL') {
      if (!this.paypalAccountLabel.trim() || !this.paypalReceiveEmail.trim()) return;
      req = { type: 'PAYPAL', label: this.paypalAccountLabel.trim(), paypalEmail: this.paypalReceiveEmail.trim(), isDefault: true };
    } else {
      if (!this.cryptoWalletLabel.trim() || !this.cryptoWalletAddress.trim()) return;
      req = {
        type: 'CRYPTO', label: this.cryptoWalletLabel.trim(),
        walletAddress: this.cryptoWalletAddress.trim(),
        chainId: this.cryptoChainId ?? undefined,
        chainName: this.cryptoChainName.trim() || undefined,
        isDefault: true,
      };
    }

    this.savingAccount.set(true);
    this.paymentMethodService.add(req).subscribe({
      next: () => { this.loadReceivingAccounts(); this.closeAccountForm(); this.savingAccount.set(false); },
      error: () => this.savingAccount.set(false),
    });
  }

  deleteReceivingAccount(id: number) {
    if (!confirm('Bu hesabı silmek istediğinize emin misiniz?')) return;
    this.deletingAccountId.set(id);
    this.paymentMethodService.delete(id).subscribe({
      next: () => { this.receivingAccounts.update(arr => arr.filter(a => a.id !== id)); this.deletingAccountId.set(null); },
      error: () => this.deletingAccountId.set(null),
    });
  }

  accountsForType(type: PaymentType): SavedPaymentMethod[] {
    return this.receivingAccounts().filter(a => a.type === type);
  }

  accountSummary(pm: SavedPaymentMethod): string {
    if (pm.type === 'STRIPE') return pm.stripePaymentMethodId ?? pm.label;
    if (pm.type === 'PAYPAL') return pm.paypalEmail ?? pm.label;
    if (pm.type === 'CRYPTO') return pm.walletAddress ? pm.walletAddress.slice(0, 10) + '...' + pm.walletAddress.slice(-8) : pm.label;
    return pm.label;
  }

  private resetAccountForm() {
    this.stripeAccountId = ''; this.stripeAccountLabel = '';
    this.paypalReceiveEmail = ''; this.paypalAccountLabel = '';
    this.cryptoWalletAddress = ''; this.cryptoChainId = null;
    this.cryptoChainName = ''; this.cryptoWalletLabel = '';
  }
}
