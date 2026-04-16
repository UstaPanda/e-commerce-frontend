import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollRowComponent } from '../../components/scroll-row/scroll-row';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroments';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sqlQuery?: string;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollRowComponent, TranslateModule],
  templateUrl: './ai-assistant.html',
})
export class AiAssistantComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private http = inject(HttpClient);
  private translate = inject(TranslateService);

  messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      content: this.translate.instant('AI_ASSISTANT.WELCOME'),
      timestamp: new Date(),
    },
  ]);

  inputText = '';
  sending = signal(false);
  private shouldScroll = false;
  private currentSessionId: number | null = null;

  readonly quickPromptKeys = [
    'AI_ASSISTANT.QUICK_PROMPTS.POPULAR',
    'AI_ASSISTANT.QUICK_PROMPTS.CART',
    'AI_ASSISTANT.QUICK_PROMPTS.ORDER',
    'AI_ASSISTANT.QUICK_PROMPTS.DISCOUNT',
  ];

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  send(text?: string) {
    const content = (text ?? this.inputText).trim();
    if (!content || this.sending()) return;

    this.messages.update(msgs => [...msgs, { role: 'user', content, timestamp: new Date() }]);
    this.inputText = '';
    this.sending.set(true);
    this.shouldScroll = true;

    const body: { question: string; sessionId?: number } = { question: content };
    if (this.currentSessionId) body.sessionId = this.currentSessionId;

    this.http.post<{ sessionId: number; answer: string; sqlQuery?: string }>(`${environment.apiUrl}/chat/ask`, body).subscribe({
      next: (res) => {
        this.currentSessionId = res.sessionId;
        this.messages.update(msgs => [...msgs, {
          role: 'assistant',
          content: res.answer,
          timestamp: new Date(),
          sqlQuery: res.sqlQuery ?? undefined,
        }]);
        this.sending.set(false);
        this.shouldScroll = true;
      },
      error: () => {
        this.messages.update(msgs => [...msgs, {
          role: 'assistant',
          content: this.translate.instant('AI_ASSISTANT.ERROR'),
          timestamp: new Date(),
        }]);
        this.sending.set(false);
        this.shouldScroll = true;
      },
    });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  sendPrompt(key: string) {
    this.send(this.translate.instant(key));
  }

  clearChat() {
    this.currentSessionId = null;
    this.messages.set([{
      role: 'assistant',
      content: this.translate.instant('AI_ASSISTANT.CLEARED'),
      timestamp: new Date(),
    }]);
  }
}
