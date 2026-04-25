import {
  Component,
  inject,
  signal,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnDestroy,
  PLATFORM_ID,
  Input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  visualizationData?: any;
  isOutOfScope?: boolean;
}

interface AiResponse {
  final_answer: string | null;
  sql_query: string | null;
  query_result: any[] | null;
  visualization_code: string | null;
  visualization_data: any | null;
  is_in_scope: boolean;
  error: string | null;
  execution_time: number;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollRowComponent, TranslateModule],
  templateUrl: './ai-assistant.html',
})
export class AiAssistantComponent implements AfterViewChecked, OnDestroy {
  @Input() embedded = false;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private http = inject(HttpClient);
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);

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
  private renderedCharts = new Set<number>();

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
    if (isPlatformBrowser(this.platformId)) {
      this.renderPendingCharts();
    }
  }

  ngOnDestroy() {
    this.renderedCharts.clear();
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  private renderPendingCharts() {
    const msgs = this.messages();
    msgs.forEach((msg, i) => {
      if (msg.visualizationData && !this.renderedCharts.has(i)) {
        const el = document.getElementById(`ai-chart-${i}`);
        if (el) {
          this.renderedCharts.add(i);
          import('plotly.js-dist-min').then((PlotlyModule: any) => {
            const Plotly = PlotlyModule.default || PlotlyModule;
            const fig = msg.visualizationData;
            Plotly.newPlot(el, fig.data ?? [], {
              ...fig.layout,
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              font: { family: 'Plus Jakarta Sans, sans-serif', size: 12 },
              margin: { t: 40, r: 16, b: 40, l: 40 },
            }, { responsive: true, displayModeBar: false });
          });
        }
      }
    });
  }

  send(text?: string) {
    const content = (text ?? this.inputText).trim();
    if (!content || this.sending()) return;

    this.messages.update(msgs => [...msgs, { role: 'user', content, timestamp: new Date() }]);
    this.inputText = '';
    this.sending.set(true);
    this.shouldScroll = true;

    this.http
      .post<AiResponse>(`${environment.aiUrl}/api/chat/ask`, { question: content })
      .subscribe({
        next: (res) => {
          const answer =
            res.final_answer ??
            (res.error ? this.translate.instant('AI_ASSISTANT.ERROR') : '');

          this.messages.update(msgs => [
            ...msgs,
            {
              role: 'assistant',
              content: answer,
              timestamp: new Date(),
              sqlQuery: res.sql_query ?? undefined,
              visualizationData: res.visualization_data ?? undefined,
              isOutOfScope: !res.is_in_scope,
            },
          ]);
          this.sending.set(false);
          this.shouldScroll = true;
        },
        error: () => {
          this.messages.update(msgs => [
            ...msgs,
            {
              role: 'assistant',
              content: this.translate.instant('AI_ASSISTANT.ERROR'),
              timestamp: new Date(),
            },
          ]);
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
    this.renderedCharts.clear();
    this.messages.set([
      {
        role: 'assistant',
        content: this.translate.instant('AI_ASSISTANT.CLEARED'),
        timestamp: new Date(),
      },
    ]);
  }
}
