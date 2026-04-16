import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  template: `<div class="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
    <p class="text-gray-400">Giriş yapılıyor...</p>
  </div>`,
})
export class OAuth2CallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const { accessToken, refreshToken, email, name, role } = params;
      if (accessToken && refreshToken) {
        this.auth.saveSession({ accessToken, refreshToken, email, name, role });
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
