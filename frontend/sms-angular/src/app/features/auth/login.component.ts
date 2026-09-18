import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>School Management System</mat-card-title>
          <mat-card-subtitle>Sign in</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput [(ngModel)]="username" name="username" required autocomplete="username">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required autocomplete="current-password">
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" class="full-width" [disabled]="loading()">
              @if (loading()) {
                <mat-progress-spinner diameter="20" mode="indeterminate" class="inline-spinner" />
              }
              Login
            </button>
            <button mat-button type="button" class="full-width mt-2" [routerLink]="['/forgot-password']">
              Forgot password?
            </button>
            @if (error()) {
              <div class="error">{{ error() }}</div>
            }
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrapper { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .login-card { width: 100%; max-width: 420px; padding: 8px; }
    .full-width { width: 100%; }
    .inline-spinner { display: inline-block; margin-right: 8px; vertical-align: middle; }
    .error { color: #d32f2f; margin-top: 12px; font-size: 14px; }
    .mt-2 { margin-top: 8px; }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  username = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string>('');

  async submit() {
    if (!this.username || !this.password) return;
    this.error.set('');
    this.loading.set(true);
    try {
      const result = await this.authService.login({ username: this.username, password: this.password });
      if (result?.success) {
        this.snack.open('Login successful', 'OK', { duration: 2000 });
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set(result?.message ?? 'Login failed');
      }
    } catch {
      this.error.set('An error occurred. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
