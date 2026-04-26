export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  recaptchaToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'INDIVIDUAL' | 'CORPORATE';
  gender: 'M' | 'F';
  recaptchaToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
  email: string;
  name: string;
  requiresTwoFactor?: boolean;
  tempToken?: string;
}

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}
