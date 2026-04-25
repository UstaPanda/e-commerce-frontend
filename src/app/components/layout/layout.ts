import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { CurrencyService, SUPPORTED_CURRENCIES } from '../../services/currency.service';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher';
import { AiAssistantComponent } from '../../pages/ai-assistant/ai-assistant';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, LanguageSwitcherComponent, AiAssistantComponent],
  templateUrl: './layout.html',
})
export class LayoutComponent {
  auth = inject(AuthService);
  currency = inject(CurrencyService);
  cartService = inject(CartService);
  langService = inject(LanguageService);
  user = this.auth.currentUser;
  currencies = SUPPORTED_CURRENCIES;
  showCurrencyMenu = false;
  showLangMenu = false;
  showChatPopup = false;

  currentLangFlag(): string {
    return this.langService.getLang(this.langService.currentLang())?.flag ?? '🌐';
  }
}
