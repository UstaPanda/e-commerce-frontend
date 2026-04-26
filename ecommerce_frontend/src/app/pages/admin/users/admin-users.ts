import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService, AdminUser } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './admin-users.html',
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  loading = signal(true);
  users = signal<AdminUser[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  searchQuery = '';
  actionLoading = signal<number | null>(null);

  // Confirmation modal
  confirmModal = signal<{ user: AdminUser; action: 'suspend' | 'activate' | 'delete' } | null>(null);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(page = 0) {
    this.loading.set(true);
    this.adminService.getUsers(page, 20, this.searchQuery).subscribe({
      next: (res) => {
        this.users.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.number);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch() {
    this.loadUsers(0);
  }

  openConfirm(user: AdminUser, action: 'suspend' | 'activate' | 'delete') {
    this.confirmModal.set({ user, action });
  }

  closeConfirm() {
    this.confirmModal.set(null);
  }

  confirmAction() {
    const modal = this.confirmModal();
    if (!modal) return;
    this.actionLoading.set(modal.user.id);
    this.confirmModal.set(null);

    if (modal.action === 'delete') {
      this.adminService.deleteUser(modal.user.id).subscribe({
        next: () => {
          this.users.update(list => list.filter(u => u.id !== modal.user.id));
          this.actionLoading.set(null);
        },
        error: () => this.actionLoading.set(null),
      });
    } else {
      const newStatus = modal.action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';
      this.adminService.updateUserStatus(modal.user.id, newStatus).subscribe({
        next: (updated) => {
          this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
          this.actionLoading.set(null);
        },
        error: () => this.actionLoading.set(null),
      });
    }
  }

  prevPage() {
    if (this.currentPage() > 0) this.loadUsers(this.currentPage() - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) this.loadUsers(this.currentPage() + 1);
  }

  roleBadgeClass(role: string): string {
    if (role === 'ADMIN') return 'bg-error/10 text-error';
    if (role === 'CORPORATE') return 'bg-primary/10 text-primary';
    return 'bg-surface-container-high text-on-surface-variant';
  }

  statusBadgeClass(status: string): string {
    if (status === 'ACTIVE') return 'bg-secondary/10 text-secondary';
    if (status === 'SUSPENDED') return 'bg-error/10 text-error';
    return 'bg-surface-container-high text-on-surface-variant';
  }
}
