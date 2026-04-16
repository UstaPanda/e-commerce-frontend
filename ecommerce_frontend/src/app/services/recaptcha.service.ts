import { Injectable } from '@angular/core';
import { environment } from '../../enviroments/enviroments';

declare const grecaptcha: any;

@Injectable({ providedIn: 'root' })
export class RecaptchaService {
  private loaded = false;

  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${environment.recaptchaSiteKey}`;
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
        grecaptcha.execute(environment.recaptchaSiteKey, { action }).then(resolve);
      });
    });
  }
}
