import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [LayoutComponent, RouterOutlet],
  template: `<app-layout><router-outlet /></app-layout>`,
})
export class ShellComponent {}
