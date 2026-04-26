import { Component, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';
import { RecaptchaService } from '../../../services/recaptcha.service';
import { LanguageService } from '../../../services/language.service';

import { environment } from '../../../../enviroments/enviroments';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './login.html',
})
export class LoginComponent {
  readonly environment = environment;
  private auth = inject(AuthService);
  private recaptcha = inject(RecaptchaService);
  private router = inject(Router);
  private zone = inject(NgZone);
  lang = inject(LanguageService); // ensures translations are initialized on auth routes

  email = '';
  password = '';
  rememberMe = false;
  loading = false;
  error = '';
  showPassword = false;

  readonly features = [
    { icon: 'storefront', key: 'AUTH.LOGIN.FEATURES.STORES' },
    { icon: 'local_shipping', key: 'AUTH.LOGIN.FEATURES.SHIPPING' },
    { icon: 'smart_toy', key: 'AUTH.LOGIN.FEATURES.AI' },
    { icon: 'verified', key: 'AUTH.LOGIN.FEATURES.PAYMENT' },
  ];

  async onSubmit() {
    this.error = '';
    this.loading = true;
    try {
      const recaptchaToken = await this.recaptcha.execute('login');

      this.zone.run(() => {
        if (!recaptchaToken) {
          this.error = 'Lütfen "Ben robot değilim" kutucuğunu işaretleyin.';
          this.loading = false;
          return;
        }

        this.auth.login({ email: this.email, password: this.password, rememberMe: this.rememberMe, recaptchaToken }).subscribe({
          next: (res) => {
            this.loading = false;
            if (res.requiresTwoFactor) {
              this.router.navigate(['/auth/2fa'], { state: { tempToken: res.tempToken } });
            } else {
              this.router.navigate(['/dashboard']);
            }
          },
          error: (err) => {
            try {
              const body = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
              this.error = body?.message || 'Giriş başarısız';
            } catch {
              this.error = 'Giriş başarısız';
            }
            this.loading = false;
          },
        });
      });
    } catch (err: any) {
      this.zone.run(() => {
        this.error = err?.message || 'Doğrulama hatası oluştu';
        this.loading = false;
      });
    }
  }
}
