import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

export interface Language {
  code: string;
  label: string;
  flag: string;
  rtl: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', rtl: false },
  { code: 'en', label: 'English', flag: '🇬🇧', rtl: false },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', rtl: true },
];

const STORAGE_KEY = 'iv_lang';
const DEFAULT_LANG = 'tr';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private platformId = inject(PLATFORM_ID);
  private translate = inject(TranslateService);

  readonly currentLang = signal<string>(DEFAULT_LANG);
  readonly isRtl = signal<boolean>(false);
  readonly languages = SUPPORTED_LANGUAGES;

  constructor() {
    const saved = isPlatformBrowser(this.platformId)
      ? (localStorage.getItem(STORAGE_KEY) ?? this.detectBrowserLang())
      : DEFAULT_LANG;

    this.translate.addLangs(SUPPORTED_LANGUAGES.map((l) => l.code));
    this.translate.setDefaultLang(DEFAULT_LANG);
    this.setLanguage(saved);

    // Keep document direction in sync
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.dir = this.isRtl() ? 'rtl' : 'ltr';
        document.documentElement.lang = this.currentLang();
      }
    });
  }

  setLanguage(code: string): void {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? SUPPORTED_LANGUAGES[0];
    this.translate.use(lang.code);
    this.currentLang.set(lang.code);
    this.isRtl.set(lang.rtl);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, lang.code);
    }
  }

  getLang(code: string): Language | undefined {
    return SUPPORTED_LANGUAGES.find((l) => l.code === code);
  }

  private detectBrowserLang(): string {
    const browserLang = navigator.language?.split('-')[0]?.toLowerCase();
    const match = SUPPORTED_LANGUAGES.find((l) => l.code === browserLang);
    return match?.code ?? DEFAULT_LANG;
  }
}
