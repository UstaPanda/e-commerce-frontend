import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService, AuditLog } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './admin-audit-logs.html',
})
export class AdminAuditLogsComponent implements OnInit {
  private adminService = inject(AdminService);

  loading = signal(true);
  logs = signal<AuditLog[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  selectedAction = '';

  actionTypes = [
    '', 'USER_CREATED', 'USER_SUSPENDED', 'USER_DELETED',
    'STORE_CREATED', 'STORE_STATUS_CHANGED',
    'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED',
    'ORDER_PLACED', 'ORDER_STATUS_CHANGED',
    'CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_DELETED',
  ];

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs(page = 0) {
    this.loading.set(true);
    this.adminService.getAuditLogs(page, 30, this.selectedAction).subscribe({
      next: (res) => {
        this.logs.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.number);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange() {
    this.loadLogs(0);
  }

  prevPage() {
    if (this.currentPage() > 0) this.loadLogs(this.currentPage() - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) this.loadLogs(this.currentPage() + 1);
  }

  actionIcon(action: string): string {
    if (action.includes('USER')) return 'person';
    if (action.includes('STORE')) return 'storefront';
    if (action.includes('PRODUCT')) return 'inventory_2';
    if (action.includes('ORDER')) return 'receipt_long';
    if (action.includes('CATEGORY')) return 'category';
    return 'history';
  }

  actionColor(action: string): string {
    if (action.includes('DELETED') || action.includes('SUSPENDED')) return 'bg-error/10 text-error';
    if (action.includes('CREATED')) return 'bg-secondary/10 text-secondary';
    if (action.includes('UPDATED') || action.includes('CHANGED')) return 'bg-tertiary/10 text-tertiary';
    return 'bg-primary/10 text-primary';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  }
}
