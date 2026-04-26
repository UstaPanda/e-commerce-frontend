import { Component, inject, NgZone, OnInit, signal } from '@angular/core';
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
export class LoginComponent implements OnInit {
  readonly environment = environment;
  private auth = inject(AuthService);
  private recaptcha = inject(RecaptchaService);
  private router = inject(Router);
  private zone = inject(NgZone);
  lang = inject(LanguageService); // ensures translations are initialized on auth routes

  email = signal('');
  password = signal('');
  rememberMe = signal(false);
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  readonly features = [
    { icon: 'storefront', key: 'AUTH.LOGIN.FEATURES.STORES' },
    { icon: 'local_shipping', key: 'AUTH.LOGIN.FEATURES.SHIPPING' },
    { icon: 'smart_toy', key: 'AUTH.LOGIN.FEATURES.AI' },
    { icon: 'verified', key: 'AUTH.LOGIN.FEATURES.PAYMENT' },
  ];

  async ngOnInit() {
    await this.recaptcha.load();
    this.recaptcha.render('recaptcha-v2-container');
  }

  async onSubmit() {
    if (this.loading()) return;
    
    this.error.set('');
    this.loading.set(true);
    
    try {
      const recaptchaToken = await this.recaptcha.execute('login');

      this.zone.run(() => {
        if (!recaptchaToken) {
          this.error.set('Lütfen "Ben robot değilim" kutucuğunu işaretleyin.');
          this.loading.set(false);
          return;
        }

        this.auth.login({ 
          email: this.email(), 
          password: this.password(), 
          rememberMe: this.rememberMe(), 
          recaptchaToken 
        }).subscribe({
          next: (res) => {
            this.loading.set(false);
            if (res.requiresTwoFactor) {
              this.router.navigate(['/auth/2fa'], { state: { tempToken: res.tempToken } });
            } else {
              this.router.navigate(['/dashboard']);
            }
          },
          error: (err) => {
            this.recaptcha.reset(); // Reset captcha on error
            try {
              const body = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
              this.error.set(body?.message || 'Giriş başarısız');
            } catch {
              this.error.set('Giriş başarısız');
            }
            this.loading.set(false);
          },
        });
      });
    } catch (err: any) {
      this.zone.run(() => {
        this.recaptcha.reset();
        this.error.set(err?.message || 'Doğrulama hatası oluştu');
        this.loading.set(false);
      });
    }
  }
}
