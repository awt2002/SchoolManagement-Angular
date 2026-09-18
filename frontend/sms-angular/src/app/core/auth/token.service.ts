import { Injectable, signal, computed } from '@angular/core';
import { UserRole } from '../models/user-role.model';

interface JwtPayload {
  nameid?: string;
  unique_name?: string;
  role?: string;
  sub?: string;
  exp?: number;
  [key: string]: unknown;
}

const ACCESS_TOKEN_KEY = 'sms.accessToken';
const EXPIRES_AT_KEY = 'sms.expiresAt';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly _token = signal<string>(this.readTokenFromStorage());
  private readonly _expiresAt = signal<number>(this.readExpiryFromStorage());

  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => {
    const t = this._token();
    return !!t && this._expiresAt() > Date.now();
  });

  readonly role = computed<UserRole | null>(() => {
    const claims = this.parseClaims();
    const raw = claims?.role ?? null;
    if (raw === 'Admin' || raw === 'Teacher' || raw === 'Student') return raw;
    return null;
  });

  readonly username = computed<string | null>(() => {
    const claims = this.parseClaims();
    return (claims?.unique_name as string | undefined) ?? null;
  });

  readonly userId = computed<string | null>(() => {
    const claims = this.parseClaims();
    return (claims?.nameid as string | undefined) ?? (claims?.sub as string | undefined) ?? null;
  });

  setToken(token: string, expiresAtIso: string): void {
    const expiresAt = new Date(expiresAtIso).getTime();
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    this._token.set(token);
    this._expiresAt.set(expiresAt);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    this._token.set('');
    this._expiresAt.set(0);
  }

  isExpiringSoon(): boolean {
    return this._expiresAt() <= Date.now() + 60_000;
  }

  private parseClaims(): JwtPayload | null {
    const t = this._token();
    if (!t) return null;
    try {
      const [, payload] = t.split('.');
      if (!payload) return null;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  private readTokenFromStorage(): string {
    try { return localStorage.getItem(ACCESS_TOKEN_KEY) ?? ''; } catch { return ''; }
  }

  private readExpiryFromStorage(): number {
    try {
      const raw = localStorage.getItem(EXPIRES_AT_KEY);
      return raw ? Number(raw) : 0;
    } catch { return 0; }
  }
}
