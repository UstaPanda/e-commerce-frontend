import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService, AdminCategory } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './admin-categories.html',
})
export class AdminCategoriesComponent implements OnInit {
  private adminService = inject(AdminService);

  loading = signal(true);
  categories = signal<AdminCategory[]>([]);
  actionLoading = signal<number | null>(null);

  // Modal state
  modal = signal<{
    mode: 'create' | 'edit';
    id?: number;
    name: string;
    parentId: number | null;
  } | null>(null);

  deleteConfirm = signal<AdminCategory | null>(null);
  saving = signal(false);

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading.set(true);
    this.adminService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.modal.set({ mode: 'create', name: '', parentId: null });
  }

  openEdit(cat: AdminCategory) {
    this.modal.set({ mode: 'edit', id: cat.id, name: cat.name, parentId: cat.parentId });
  }

  closeModal() {
    this.modal.set(null);
  }

  saveModal() {
    const m = this.modal();
    if (!m || !m.name.trim()) return;
    this.saving.set(true);

    const obs = m.mode === 'create'
      ? this.adminService.createCategory(m.name.trim(), m.parentId)
      : this.adminService.updateCategory(m.id!, m.name.trim(), m.parentId);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.modal.set(null);
        this.loadCategories();
      },
      error: () => this.saving.set(false),
    });
  }

  openDelete(cat: AdminCategory) {
    this.deleteConfirm.set(cat);
  }

  closeDelete() {
    this.deleteConfirm.set(null);
  }

  confirmDelete() {
    const cat = this.deleteConfirm();
    if (!cat) return;
    this.actionLoading.set(cat.id);
    this.deleteConfirm.set(null);
    this.adminService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.categories.update(list => list.filter(c => c.id !== cat.id));
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null),
    });
  }

  parentCategories(): AdminCategory[] {
    const m = this.modal();
    return this.categories().filter(c => !m?.id || c.id !== m.id);
  }
}
