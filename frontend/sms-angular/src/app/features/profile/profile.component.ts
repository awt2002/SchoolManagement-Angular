import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TokenService } from '../../core/auth/token.service';
import { AuthService } from '../../core/auth/auth.service';
import { StudentHttpService } from '../../core/http/student-http.service';
import { StudentDetailDto } from '../../core/models/student.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule
  ],
  template: `
    <h1>My profile</h1>

    @if (role() === 'Student' && student(); as s) {
      <mat-card>
        <mat-card-content>
          <h2>{{ s.fullName }}</h2>
          <p><strong>Date of birth:</strong> {{ s.dateOfBirth }}</p>
          <p><strong>Address:</strong> {{ s.address }}</p>
          <p><strong>Enrollment year:</strong> {{ s.enrollmentYear }}</p>
        </mat-card-content>
      </mat-card>

      @if (s.enrollments.length) {
        <h2 class="mt-2">Enrollment history</h2>
        <table mat-table [dataSource]="s.enrollments" class="mat-elevation-z1">
          <ng-container matColumnDef="class">
            <th mat-header-cell *matHeaderCellDef>Class</th>
            <td mat-cell *matCellDef="let e">{{ e.className }}</td>
          </ng-container>
          <ng-container matColumnDef="year">
            <th mat-header-cell *matHeaderCellDef>Academic year</th>
            <td mat-cell *matCellDef="let e">{{ e.academicYearName }}</td>
          </ng-container>
          <ng-container matColumnDef="enrolled">
            <th mat-header-cell *matHeaderCellDef>Enrolled at</th>
            <td mat-cell *matCellDef="let e">{{ e.enrolledAt | date:'shortDate' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="['class','year','enrolled']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['class','year','enrolled']"></tr>
        </table>
      }
    }

    @if (role() === 'Admin' || role() === 'Teacher') {
      <mat-card>
        <mat-card-content>
          <p><strong>Username:</strong> {{ username() }}</p>
          <p><strong>Role:</strong> {{ role() }}</p>
        </mat-card-content>
      </mat-card>
    }

    @if (role() === 'Teacher' || role() === 'Student') {
      <h2 class="mt-2">Change password</h2>
      <mat-card>
        <mat-card-content class="pw-grid">
          <mat-form-field appearance="outline">
            <mat-label>Old password</mat-label>
            <input matInput type="password" [(ngModel)]="currentPassword">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>New password</mat-label>
            <input matInput type="password" [(ngModel)]="newPassword">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Confirm new</mat-label>
            <input matInput type="password" [(ngModel)]="confirmNewPassword">
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="changePassword()">Change password</button>
        </mat-card-actions>
      </mat-card>
    }
  `,
  styles: [`
    .mt-2 { margin-top: 24px; }
    .pw-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
    table { width: 100%; }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);
  private readonly studentSvc = inject(StudentHttpService);
  private readonly snack = inject(MatSnackBar);

  readonly role = this.tokenService.role;
  readonly username = this.tokenService.username;
  readonly student = signal<StudentDetailDto | null>(null);

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';

  ngOnInit(): void {
    if (this.role() === 'Student') {
      this.studentSvc.getMyProfile().subscribe(r => this.student.set(r?.data ?? null));
    }
  }

  async changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.snack.open('Please fill in all password fields', 'OK', { duration: 3000 });
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.snack.open('New password and confirmation do not match', 'OK', { duration: 3000 });
      return;
    }
    try {
      const result = await firstValueFrom(this.authService.changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
        confirmNewPassword: this.confirmNewPassword
      }));
      if (result?.success) {
        this.snack.open('Password changed successfully', 'OK', { duration: 3000 });
        this.currentPassword = this.newPassword = this.confirmNewPassword = '';
      } else {
        this.snack.open(result?.message ?? 'Failed to change password', 'OK', { duration: 3000 });
      }
    } catch {
      this.snack.open('An error occurred', 'OK', { duration: 3000 });
    }
  }
}
