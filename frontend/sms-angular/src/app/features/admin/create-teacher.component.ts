import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeacherHttpService } from '../../core/http/teacher-http.service';

@Component({
  selector: 'app-create-teacher',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
  template: `
    <h1>Create teacher</h1>
    <mat-card>
      <mat-card-content class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Full name</mat-label><input matInput [(ngModel)]="fullName"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Username</mat-label><input matInput [(ngModel)]="username"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" [(ngModel)]="email"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Phone number</mat-label><input matInput [(ngModel)]="phoneNumber"></mat-form-field>
      </mat-card-content>
      <mat-card-actions>
        <button mat-flat-button color="primary" (click)="submit()">Create teacher</button>
        <button mat-button (click)="cancel()">Cancel</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:700px){.form-grid{grid-template-columns:1fr}}`]
})
export class CreateTeacherComponent {
  private readonly svc = inject(TeacherHttpService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  fullName = '';
  username = '';
  email = '';
  phoneNumber = '';

  async submit() {
    const r = await firstValueFrom(this.svc.create({
      fullName: this.fullName,
      username: this.username,
      email: this.email,
      phoneNumber: this.phoneNumber,
      classId: null
    }));
    if (r?.success) {
      const uname = r.data?.username ?? this.username;
      this.snack.open(`Teacher created (${uname}). Welcome email sent.`, 'OK', { duration: 4000 });
      this.router.navigate(['/admin/teachers']);
    } else {
      const msg = (r?.errors && r.errors.length) ? r.errors.join(', ') : (r?.message ?? 'Failed');
      this.snack.open(msg, 'OK', { duration: 4000 });
    }
  }

  cancel() { this.router.navigate(['/admin/teachers']); }
}
