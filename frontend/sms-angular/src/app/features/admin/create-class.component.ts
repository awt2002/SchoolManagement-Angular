import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClassHttpService } from '../../core/http/class-http.service';
import { TeacherHttpService } from '../../core/http/teacher-http.service';
import { AcademicYearHttpService } from '../../core/http/academic-year-http.service';
import { TeacherDto } from '../../core/models/teacher.model';
import { AcademicYearDto } from '../../core/models/academic-year.model';

@Component({
  selector: 'app-create-class',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCardModule],
  template: `
    <h1>Create class</h1>
    <mat-card>
      <mat-card-content class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Class name</mat-label><input matInput [(ngModel)]="name"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Grade level (1-12)</mat-label><input matInput type="number" [(ngModel)]="gradeLevel" min="1" max="12"></mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Teacher (optional)</mat-label>
          <mat-select [(ngModel)]="teacherId">
            <mat-option [value]="null">None</mat-option>
            @for (t of teachers(); track t.id) { <mat-option [value]="t.id">{{ t.fullName }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Academic year</mat-label>
          <mat-select [(ngModel)]="academicYearId">
            @for (y of years(); track y.id) { <mat-option [value]="y.id">{{ y.name }}{{ y.isActive ? ' (Active)' : '' }}</mat-option> }
          </mat-select>
        </mat-form-field>
      </mat-card-content>
      <mat-card-actions>
        <button mat-flat-button color="primary" (click)="submit()">Create</button>
        <button mat-button (click)="cancel()">Cancel</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:700px){.form-grid{grid-template-columns:1fr}}`]
})
export class CreateClassComponent implements OnInit {
  private readonly svc = inject(ClassHttpService);
  private readonly teacherSvc = inject(TeacherHttpService);
  private readonly yearSvc = inject(AcademicYearHttpService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly teachers = signal<TeacherDto[]>([]);
  readonly years = signal<AcademicYearDto[]>([]);

  name = '';
  gradeLevel = 1;
  teacherId: string | null = null;
  academicYearId: string = '';

  ngOnInit(): void {
    this.teacherSvc.getAll({ page: 1, pageSize: 100 }).subscribe(r => this.teachers.set(r?.data ?? []));
    this.yearSvc.getAll().subscribe(r => {
      const list = r?.data ?? [];
      this.years.set(list);
      const active = list.find(y => y.isActive);
      if (active) this.academicYearId = active.id;
    });
  }

  async submit() {
    const r = await firstValueFrom(this.svc.create({
      name: this.name,
      gradeLevel: this.gradeLevel,
      teacherId: this.teacherId,
      academicYearId: this.academicYearId
    }));
    if (r?.success) { this.snack.open('Class created', 'OK', { duration: 2500 }); this.router.navigate(['/admin/classes']); }
    else { this.snack.open(r?.message ?? 'Failed', 'OK', { duration: 4000 }); }
  }

  cancel() { this.router.navigate(['/admin/classes']); }
}
