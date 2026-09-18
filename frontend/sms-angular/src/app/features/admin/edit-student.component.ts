import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StudentHttpService } from '../../core/http/student-http.service';

@Component({
  selector: 'app-edit-student',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatButtonModule, MatCardModule
  ],
  template: `
    <h1>Edit student</h1>
    @if (loaded()) {
      <mat-card>
        <mat-card-content class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Full name</mat-label>
            <input matInput [(ngModel)]="fullName" maxlength="100">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Date of birth</mat-label>
            <input matInput [matDatepicker]="dob" [(ngModel)]="dateOfBirth">
            <mat-datepicker-toggle matIconSuffix [for]="dob" />
            <mat-datepicker #dob />
          </mat-form-field>
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Address</mat-label>
            <input matInput [(ngModel)]="address">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Parent name</mat-label>
            <input matInput [(ngModel)]="parentName">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Parent email</mat-label>
            <input matInput type="email" [(ngModel)]="parentEmail">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Parent phone</mat-label>
            <input matInput [(ngModel)]="parentPhone">
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="submit()">Save changes</button>
          <button mat-button (click)="cancel()">Cancel</button>
        </mat-card-actions>
      </mat-card>
    }
  `,
  styles: [`
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .span-2 { grid-column: span 2; }
    @media (max-width:700px) { .form-grid { grid-template-columns:1fr; } .span-2 { grid-column: auto; } }
  `]
})
export class EditStudentComponent implements OnInit {
  private readonly svc = inject(StudentHttpService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  @Input() id!: string;
  readonly loaded = signal(false);

  fullName = '';
  dateOfBirth: Date | null = null;
  address = '';
  parentName = '';
  parentEmail = '';
  parentPhone = '';

  ngOnInit(): void {
    this.svc.getById(this.id).subscribe(r => {
      const s = r?.data;
      if (!s) return;
      this.fullName = s.fullName;
      this.dateOfBirth = s.dateOfBirth ? new Date(s.dateOfBirth) : null;
      this.address = s.address;
      this.parentName = s.parentName;
      this.parentEmail = s.parentEmail;
      this.parentPhone = s.parentPhone;
      this.loaded.set(true);
    });
  }

  async submit() {
    const dobIso = this.dateOfBirth ? this.dateOfBirth.toISOString().substring(0, 10) : '';
    const r = await firstValueFrom(this.svc.update(this.id, {
      fullName: this.fullName,
      dateOfBirth: dobIso,
      address: this.address,
      parentName: this.parentName,
      parentEmail: this.parentEmail,
      parentPhone: this.parentPhone
    }));
    if (r?.success) {
      this.snack.open('Student updated', 'OK', { duration: 2500 });
      this.router.navigate(['/admin/students', this.id]);
    } else {
      this.snack.open(r?.message ?? 'Failed to update', 'OK', { duration: 4000 });
    }
  }

  cancel() { this.router.navigate(['/admin/students', this.id]); }
}
