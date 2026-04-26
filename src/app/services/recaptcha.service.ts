import { Injectable } from '@angular/core';
import { environment } from '../../enviroments/enviroments';

declare const grecaptcha: any;

@Injectable({ providedIn: 'root' })
export class RecaptchaService {
  private loaded = false;

  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    return new Promise((resolve) => {
      // Use the base API URL without 'render' parameter for v2 compatibility
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.loaded = true;
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  async execute(action: string): Promise<string> {
    await this.load();
    return new Promise((resolve) => {
      grecaptcha.ready(() => {
        // v3 pattern
        if (grecaptcha.execute) {
          grecaptcha.execute(environment.recaptchaSiteKey, { action }).then(resolve);
        } else {
          // fallback or v2
          resolve(this.getResponse());
        }
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
