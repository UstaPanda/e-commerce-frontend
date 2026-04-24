import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService, AdminStore } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-stores',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './admin-stores.html',
})
export class AdminStoresComponent implements OnInit {
  private adminService = inject(AdminService);

  loading = signal(true);
  stores = signal<AdminStore[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  searchQuery = '';
  actionLoading = signal<number | null>(null);

  confirmModal = signal<{ store: AdminStore; action: 'open' | 'close' | 'pending' } | null>(null);

  ngOnInit() {
    this.loadStores();
  }

  loadStores(page = 0) {
    this.loading.set(true);
    this.adminService.getAllStores(page, 20, this.searchQuery).subscribe({
      next: (res) => {
        this.stores.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.number);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch() {
    this.loadStores(0);
  }

  openConfirm(store: AdminStore, action: 'open' | 'close' | 'pending') {
    this.confirmModal.set({ store, action });
  }

  closeConfirm() {
    this.confirmModal.set(null);
  }

  confirmAction() {
    const modal = this.confirmModal();
    if (!modal) return;
    this.actionLoading.set(modal.store.id);
    this.confirmModal.set(null);

    const statusMap: Record<string, string> = { open: 'OPEN', close: 'CLOSED', pending: 'PENDING' };
    this.adminService.updateStoreStatus(modal.store.id, statusMap[modal.action]).subscribe({
      next: (updated) => {
        this.stores.update(list => list.map(s => s.id === updated.id ? updated : s));
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null),
    });
  }

  prevPage() {
    if (this.currentPage() > 0) this.loadStores(this.currentPage() - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) this.loadStores(this.currentPage() + 1);
  }

  statusBadgeClass(status: string): string {
    if (status === 'OPEN') return 'bg-secondary/10 text-secondary';
    if (status === 'CLOSED') return 'bg-error/10 text-error';
    return 'bg-tertiary/10 text-tertiary';
  }

  statusIcon(status: string): string {
    if (status === 'OPEN') return 'store';
    if (status === 'CLOSED') return 'store_mall_directory';
    return 'pending';
  }
}
