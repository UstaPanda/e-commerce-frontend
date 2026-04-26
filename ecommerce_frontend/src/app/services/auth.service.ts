import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../enviroments/enviroments';
import { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_KEY = 'refreshToken';
  private readonly USER_KEY = 'authUser';

  currentUser = signal<AuthUser | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap((res) => {
        if (!res.requiresTwoFactor) {
          this.saveSession(res);
        }
      }),
    );
  }

  register(request: RegisterRequest): Observable<string> {
    return this.http.post(`${environment.apiUrl}/auth/register`, request, { responseType: 'text' });
  }

  verifyEmail(email: string, code: string): Observable<string> {
    return this.http.post(`${environment.apiUrl}/auth/verify`, { email, code }, { responseType: 'text' });
  }

  forgotPassword(email: string): Observable<string> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email }, { responseType: 'text' });
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<string> {
    return this.http.post(
      `${environment.apiUrl}/auth/reset-password`,
      { email, code, newPassword },
      { responseType: 'text' },
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const token = localStorage.getItem(this.REFRESH_KEY) || sessionStorage.getItem(this.REFRESH_KEY);
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { token })
      .pipe(tap((res) => this.saveSession(res)));
  }

  logout(): void {
    const token = localStorage.getItem(this.REFRESH_KEY) || sessionStorage.getItem(this.REFRESH_KEY);
    if (token) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { token }, { responseType: 'text' }).subscribe();
    }
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken() && !!this.currentUser();
  }

  getRole(): string | null {
    return this.currentUser()?.role ?? null;
  }

  saveSession(res: AuthResponse): void {
    const user: AuthUser = {
      email: res.email,
      name: res.name,
      role: res.role,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    };
    const storage = localStorage.getItem(this.REFRESH_KEY) ? localStorage : sessionStorage;
    storage.setItem(this.TOKEN_KEY, res.accessToken);
    storage.setItem(this.REFRESH_KEY, res.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
    this.currentUser.set(null);
  }
}
