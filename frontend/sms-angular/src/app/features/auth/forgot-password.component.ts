import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
  template: `
    <div class="wrapper">
      <mat-card class="card">
        <mat-card-header>
          <mat-card-title>Forgot Password</mat-card-title>
          <mat-card-subtitle>Enter your email or username to receive a reset link.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email or Username</mat-label>
            <input matInput [(ngModel)]="value" name="value">
          </mat-form-field>
          <button mat-flat-button color="primary" class="full-width" (click)="send()">Send reset link</button>
          <button mat-button class="full-width mt-2" (click)="back()">Back to login</button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .wrapper { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:16px; }
    .card { width:100%; max-width:420px; padding:8px; }
    .full-width { width:100%; }
    .mt-2 { margin-top:8px; }
  `]
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  value = '';

  async send() {
    if (!this.value.trim()) {
      this.snack.open('Please enter your email or username', 'OK', { duration: 3000 });
      return;
    }
    try {
      const result = await firstValueFrom(this.authService.forgotPassword({ email: this.value }));
      this.snack.open(result?.message ?? 'Request received', 'OK', { duration: 4000 });
      this.router.navigate(['/login']);
    } catch {
      this.snack.open('An error occurred. Try again.', 'OK', { duration: 3000 });
    }
  }

  back() { this.router.navigate(['/login']); }
}
