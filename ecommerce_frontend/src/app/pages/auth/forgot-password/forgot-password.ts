import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  loading = false;
  error = '';
  success = '';

  onSubmit() {
    this.error = '';
    this.loading = true;
    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.success = 'Şifre sıfırlama kodu email adresinize gönderildi.';
        setTimeout(() => this.router.navigate(['/auth/reset-password'], { state: { email: this.email } }), 2000);
      },
      error: (err) => {
        try {
          const body = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
          this.error = body?.message || 'İşlem başarısız';
        } catch {
          this.error = 'İşlem başarısız';
        }
        this.loading = false;
      },
    });
  }
}
