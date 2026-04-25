import { Component, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService, SUPPORTED_LANGUAGES } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './language-switcher.html',
})
export class LanguageSwitcherComponent {
  @Input() inHeader = false;

  lang = inject(LanguageService);
  languages = SUPPORTED_LANGUAGES;
  showMenu = signal(false);

  toggle(): void {
    this.showMenu.update((v) => !v);
  }

  select(code: string): void {
    this.lang.setLanguage(code);
    this.showMenu.set(false);
  }

  currentLanguage() {
    return this.languages.find((l) => l.code === this.lang.currentLang()) ?? this.languages[0];
  }
}
