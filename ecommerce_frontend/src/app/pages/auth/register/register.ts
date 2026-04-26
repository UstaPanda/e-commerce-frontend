import { Component, inject, NgZone, OnInit, signal } from '@angular/core';
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
export class RegisterComponent implements OnInit {
  readonly environment = environment;
  private auth = inject(AuthService);
  private recaptcha = inject(RecaptchaService);
  private router = inject(Router);
  private zone = inject(NgZone);

  name = signal('');
  email = signal('');
  password = signal('');
  role = signal<'INDIVIDUAL' | 'CORPORATE'>('INDIVIDUAL');
  gender = signal<'M' | 'F'>('M');
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  async ngOnInit() {
    await this.recaptcha.load();
    this.recaptcha.render('recaptcha-v2-container');
  }

  async onSubmit() {
    if (this.loading()) return;
    
    this.error.set('');
    this.loading.set(true);
    
    try {
      const recaptchaToken = await this.recaptcha.execute('register');
      
      this.zone.run(() => {
        if (!recaptchaToken) {
          this.error.set('Lütfen "Ben robot değilim" kutucuğunu işaretleyin.');
          this.loading.set(false);
          return;
        }

        this.auth.register({ 
          name: this.name(), 
          email: this.email(), 
          password: this.password(), 
          role: this.role(), 
          gender: this.gender(), 
          recaptchaToken 
        }).subscribe({
          next: () => {
            this.loading.set(false);
            this.router.navigate(['/auth/verify'], { state: { email: this.email() } });
          },
          error: (err) => {
            this.recaptcha.reset();
            try {
              const body = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
              this.error.set(body?.message || 'Kayıt başarısız');
            } catch {
              this.error.set('Kayıt başarısız');
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
