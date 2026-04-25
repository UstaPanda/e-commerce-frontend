import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy,
  Input, PLATFORM_ID, inject, NgZone,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-scroll-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-row.html',
})
export class ScrollRowComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollEl') scrollEl!: ElementRef<HTMLDivElement>;

  /** Tailwind classes forwarded to the inner scroll container (gap, padding, etc.) */
  @Input() rowClass = '';
  /** Extra classes on arrow buttons — e.g. "md:hidden" to suppress arrows on desktop */
  @Input() arrowClass = '';
  /** Set true when the parent renders its own arrows and uses a template ref to call scroll() */
  @Input() hideArrows = false;

  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);
  private resizeObs?: ResizeObserver;

  showLeft = false;
  showRight = false;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => this.checkArrows(), 80);
    this.resizeObs = new ResizeObserver(() =>
      this.zone.run(() => this.checkArrows())
    );
    this.resizeObs.observe(this.scrollEl.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObs?.disconnect();
  }

  onScroll() {
    this.checkArrows();
  }

  private checkArrows() {
    const el = this.scrollEl?.nativeElement;
    if (!el) return;
    this.showLeft = el.scrollLeft > 4;
    this.showRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 4;
  }

  scroll(dir: 1 | -1) {
    const el = this.scrollEl?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: dir * 280, behavior: 'smooth' });
    setTimeout(() => this.checkArrows(), 350);
  }
}
