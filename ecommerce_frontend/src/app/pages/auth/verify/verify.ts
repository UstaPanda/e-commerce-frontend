import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './verify.html',
})
export class VerifyComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  code = '';
  loading = false;
  error = '';
  success = '';

  ngOnInit() {
    const state = history.state;
    if (state?.email) this.email = state.email;
  }

  onSubmit() {
    this.error = '';
    this.loading = true;
    this.auth.verifyEmail(this.email, this.code).subscribe({
      next: () => {
        this.success = 'Email doğrulandı! Giriş yapabilirsiniz.';
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err) => {
        try {
          const body = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
          this.error = body?.message || 'Doğrulama başarısız';
        } catch {
          this.error = 'Doğrulama başarısız';
        }
        this.loading = false;
      },
    });
  }
}
