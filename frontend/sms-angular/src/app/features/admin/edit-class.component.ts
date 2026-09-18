import { Component, inject, signal, OnInit, Input } from '@angular/core';
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
  selector: 'app-edit-class',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCardModule],
  template: `
    <h1>Edit class</h1>
    @if (loaded()) {
      <mat-card>
        <mat-card-content class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Class name</mat-label><input matInput [(ngModel)]="name"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Grade level (1-12)</mat-label><input matInput type="number" [(ngModel)]="gradeLevel" min="1" max="12"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Teacher</mat-label>
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
          <button mat-flat-button color="primary" (click)="submit()">Save changes</button>
          <button mat-button (click)="cancel()">Cancel</button>
        </mat-card-actions>
      </mat-card>
    }
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:700px){.form-grid{grid-template-columns:1fr}}`]
})
export class EditClassComponent implements OnInit {
  private readonly svc = inject(ClassHttpService);
  private readonly teacherSvc = inject(TeacherHttpService);
  private readonly yearSvc = inject(AcademicYearHttpService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  @Input() id!: string;
  readonly loaded = signal(false);
  readonly teachers = signal<TeacherDto[]>([]);
  readonly years = signal<AcademicYearDto[]>([]);

  name = '';
  gradeLevel = 1;
  teacherId: string | null = null;
  academicYearId = '';

  ngOnInit(): void {
    this.teacherSvc.getAll({ page: 1, pageSize: 1000 }).subscribe(r => this.teachers.set(r?.data ?? []));
    this.yearSvc.getAll().subscribe(r => this.years.set(r?.data ?? []));
    this.svc.getById(this.id).subscribe(r => {
      const c = r?.data;
      if (!c) return;
      this.name = c.name;
      this.gradeLevel = c.gradeLevel;
      this.teacherId = c.teacherId ?? null;
      this.academicYearId = c.academicYearId;
      this.loaded.set(true);
    });
  }

  async submit() {
    const r = await firstValueFrom(this.svc.update(this.id, {
      name: this.name,
      gradeLevel: this.gradeLevel,
      teacherId: this.teacherId,
      academicYearId: this.academicYearId
    }));
    if (r?.success) { this.snack.open('Class updated', 'OK', { duration: 2500 }); this.router.navigate(['/admin/classes']); }
    else {
      const msg = (r?.errors && r.errors.length) ? r.errors.join(', ') : (r?.message ?? 'Failed');
      this.snack.open(msg, 'OK', { duration: 4000 });
    }
  }

  cancel() { this.router.navigate(['/admin/classes']); }
}
