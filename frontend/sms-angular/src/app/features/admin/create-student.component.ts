import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StudentHttpService } from '../../core/http/student-http.service';
import { ClassHttpService } from '../../core/http/class-http.service';
import { AcademicYearHttpService } from '../../core/http/academic-year-http.service';
import { ClassDto } from '../../core/models/class.model';
import { AcademicYearDto } from '../../core/models/academic-year.model';

@Component({
  selector: 'app-create-student',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule,
    MatSelectModule, MatButtonModule, MatCardModule
  ],
  template: `
    <h1>Enroll new student</h1>
    <mat-card>
      <mat-card-content class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Full name</mat-label>
          <input matInput [(ngModel)]="fullName" required maxlength="100">
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
          <mat-label>Class</mat-label>
          <mat-select [(ngModel)]="classId">
            @for (c of classes(); track c.id) {
              <mat-option [value]="c.id">{{ c.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Academic year</mat-label>
          <mat-select [(ngModel)]="academicYearId">
            @for (y of years(); track y.id) {
              <mat-option [value]="y.id">{{ y.name }}{{ y.isActive ? ' (Active)' : '' }}</mat-option>
            }
          </mat-select>
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
        <button mat-flat-button color="primary" (click)="submit()">Create student</button>
        <button mat-button (click)="cancel()">Cancel</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .span-2 { grid-column: span 2; }
    @media (max-width:700px) { .form-grid { grid-template-columns:1fr; } .span-2 { grid-column: auto; } }
  `]
})
export class CreateStudentComponent implements OnInit {
  private readonly svc = inject(StudentHttpService);
  private readonly classSvc = inject(ClassHttpService);
  private readonly yearSvc = inject(AcademicYearHttpService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly classes = signal<ClassDto[]>([]);
  readonly years = signal<AcademicYearDto[]>([]);

  fullName = '';
  dateOfBirth: Date | null = null;
  address = '';
  classId: string | null = null;
  academicYearId: string | null = null;
  parentName = '';
  parentEmail = '';
  parentPhone = '';

  ngOnInit(): void {
    this.classSvc.getAll().subscribe(r => this.classes.set(r?.data ?? []));
    this.yearSvc.getAll().subscribe(r => {
      const list = r?.data ?? [];
      this.years.set(list);
      const active = list.find(y => y.isActive);
      if (active) this.academicYearId = active.id;
    });
  }

  async submit() {
    if (!this.classId || !this.academicYearId) {
      this.snack.open('Please select both class and academic year.', 'OK', { duration: 3000 });
      return;
    }
    const dobIso = this.dateOfBirth ? this.dateOfBirth.toISOString().substring(0, 10) : '';
    const r = await firstValueFrom(this.svc.create({
      fullName: this.fullName,
      dateOfBirth: dobIso,
      address: this.address,
      classId: this.classId,
      academicYearId: this.academicYearId,
      parentName: this.parentName,
      parentEmail: this.parentEmail,
      parentPhone: this.parentPhone
    }));
    if (r?.success) {
      const uname = r.data?.username;
      this.snack.open(`Student created${uname ? ` (${uname}). Welcome email sent.` : '.'}`, 'OK', { duration: 4000 });
      this.router.navigate(['/admin/students']);
    } else {
      this.snack.open(r?.message ?? 'Failed to create student', 'OK', { duration: 4000 });
    }
  }

  cancel() { this.router.navigate(['/admin/students']); }
}
