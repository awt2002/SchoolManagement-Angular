import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import {
  BaseResponse
} from '../models/base-response.model';
import {
  ChangePasswordDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  LoginResponseDto,
  RefreshResponseDto,
  ResetPasswordDto
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/auth`;

  async login(dto: LoginRequestDto): Promise<BaseResponse<LoginResponseDto>> {
    const result = await firstValueFrom(
      this.http.post<BaseResponse<LoginResponseDto>>(`${this.baseUrl}/login`, dto, {
        withCredentials: true
      })
    );

    if (result?.success && result.data) {
      this.tokenService.setToken(result.data.accessToken, result.data.expiresAt);
    }
    return result;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      );
    } catch {
    }
    this.tokenService.clear();
  }

  async tryRefresh(): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.http.post<BaseResponse<RefreshResponseDto>>(
          `${this.baseUrl}/refresh`, {}, { withCredentials: true }
        )
      );
      if (result?.success && result.data) {
        this.tokenService.setToken(result.data.accessToken, result.data.expiresAt);
        return true;
      }
    } catch {
    }
    return false;
  }

  changePassword(dto: ChangePasswordDto) {
    return this.http.post<BaseResponse<unknown>>(
      `${this.baseUrl}/change-password`, dto, { withCredentials: true }
    );
  }

  forgotPassword(dto: ForgotPasswordRequestDto) {
    return this.http.post<BaseResponse<unknown>>(`${this.baseUrl}/forgot-password`, dto);
  }

  resetPassword(dto: ResetPasswordDto) {
    return this.http.post<BaseResponse<unknown>>(`${this.baseUrl}/reset-password`, dto);
  }
}
