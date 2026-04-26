import { Injectable, NgZone, inject } from '@angular/core';
import { environment } from '../../enviroments/enviroments';

declare const grecaptcha: any;

@Injectable({ providedIn: 'root' })
export class RecaptchaService {
  private zone = inject(NgZone);
  private loaded = false;

  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.zone.run(() => {
          this.loaded = true;
          resolve();
        });
      };
      document.head.appendChild(script);
    });
  }

  async execute(action: string): Promise<string> {
    await this.load();
    return new Promise((resolve) => {
      grecaptcha.ready(() => {
        this.zone.run(() => {
          // 1. Önce mevcut bir yanıt var mı bak (v2 Checkbox için)
          const existingResponse = this.getResponse();
          if (existingResponse) {
            resolve(existingResponse);
            return;
          }

          // 2. Yanıt yoksa ve v3 metodu varsa çalıştır
          if (grecaptcha.execute && environment.recaptchaSiteKey.startsWith('6L')) {
             try {
               grecaptcha.execute(environment.recaptchaSiteKey, { action }).then((token: string) => {
                 this.zone.run(() => resolve(token));
               });
             } catch (e) {
               // v2 key ile v3 execute çağrılırsa hata verebilir, getResponse'a düş
               resolve(this.getResponse());
             }
          } else {
            resolve(this.getResponse());
          }
        });
      });
    });
  }

  getResponse(): string {
    if (typeof grecaptcha !== 'undefined' && grecaptcha.getResponse) {
      return grecaptcha.getResponse();
    }
    return '';
  }
}
