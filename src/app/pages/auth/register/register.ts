import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';
import { RecaptchaService } from '../../../services/recaptcha.service';

import { environment } from '../../../../enviroments/enviroments';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './register.html',
})
export class RegisterComponent {
  readonly environment = environment;
  private auth = inject(AuthService);
  private recaptcha = inject(RecaptchaService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  role: 'INDIVIDUAL' | 'CORPORATE' = 'INDIVIDUAL';
  gender: 'M' | 'F' = 'M';
  loading = false;
  error = '';
  showPassword = false;

  async onSubmit() {
    this.error = '';
    this.loading = true;
    try {
      const recaptchaToken = await this.recaptcha.execute('register');
      
      if (!recaptchaToken) {
        this.error = 'Lütfen "Ben robot değilim" kutucuğunu işaretleyin.';
        this.loading = false;
        return;
      }

      this.auth.register({ name: this.name, email: this.email, password: this.password, role: this.role, gender: this.gender, recaptchaToken }).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/auth/verify'], { state: { email: this.email } });
        },
        error: (err) => {
          try {
            const body = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
            this.error = body?.message || 'Kayıt başarısız';
          } catch {
            this.error = 'Kayıt başarısız';
          }
          this.loading = false;
        },
      });
    } catch (err: any) {
      this.error = err?.message || 'Doğrulama hatası oluştu';
      this.loading = false;
    }
  }
}
