import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
  template: `
    <div class="wrapper">
      <mat-card class="card">
        <mat-card-header>
          <mat-card-title>Reset password</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>New password</mat-label>
            <input matInput type="password" [(ngModel)]="newPassword" name="newPassword">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirm new password</mat-label>
            <input matInput type="password" [(ngModel)]="confirmPassword" name="confirmPassword">
          </mat-form-field>
          <p class="hint">At least 8 characters, including 1 uppercase letter and 1 number.</p>
          <button mat-flat-button color="primary" class="full-width" (click)="submit()">Reset</button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .wrapper { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:16px; }
    .card { width:100%; max-width:420px; padding:8px; }
    .full-width { width:100%; }
    .hint { font-size:12px; color:rgba(0,0,0,0.6); margin: 4px 0 12px; }
  `]
})
export class ResetPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snack = inject(MatSnackBar);

  newPassword = '';
  confirmPassword = '';

  async submit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.snack.open('Invalid reset link', 'OK', { duration: 3000 });
      return;
    }
    if (!this.newPassword || !this.confirmPassword) {
      this.snack.open('Please fill in all fields', 'OK', { duration: 3000 });
      return;
    }
    try {
      const result = await firstValueFrom(this.authService.resetPassword({
        token,
        newPassword: this.newPassword,
        confirmNewPassword: this.confirmPassword
      }));
      if (result?.success) {
        this.snack.open('Password reset successfully. Please log in.', 'OK', { duration: 3000 });
        this.router.navigate(['/login']);
      } else {
        this.snack.open(result?.message ?? 'Failed to reset password', 'OK', { duration: 4000 });
      }
    } catch {
      this.snack.open('An error occurred', 'OK', { duration: 3000 });
    }
  }
}
