import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ClassHttpService } from '../../core/http/class-http.service';
import { StudentHttpService } from '../../core/http/student-http.service';
import { ClassDetailDto } from '../../core/models/class.model';
import { StudentSummaryDto } from '../../core/models/student.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatTableModule,
    MatFormFieldModule, MatInputModule, MatIconModule, MatAutocompleteModule
  ],
  template: `
    @if (detail(); as d) {
      <h1>{{ d.name }}</h1>
      <mat-card>
        <mat-card-content>
          <p><strong>Grade level:</strong> {{ d.gradeLevel }}</p>
          <p><strong>Teacher:</strong> {{ d.teacherName || 'Not assigned' }}</p>
          <p><strong>Students:</strong> {{ d.studentCount }}</p>
          <p><strong>Academic year:</strong> {{ d.academicYearName }}</p>
        </mat-card-content>
      </mat-card>

      <h2 class="mt-2">Enrolled students</h2>
      <div class="enroll-row">
        <mat-form-field appearance="outline" class="grow">
          <mat-label>Search student to enroll</mat-label>
          <input matInput [(ngModel)]="studentSearch" (input)="searchStudents()" [matAutocomplete]="auto">
          <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayStudent" (optionSelected)="selectStudent($event.option.value)">
            @for (s of searchResults(); track s.id) {
              <mat-option [value]="s">{{ s.fullName }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
        <button mat-flat-button color="primary" [disabled]="!selectedStudentId" (click)="enroll()">Enroll</button>
      </div>
      <table mat-table [dataSource]="d.students" class="mat-elevation-z1">
        <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let s">{{ s.fullName }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let s">
          <button mat-icon-button color="warn" (click)="remove(s.id, s.fullName)"><mat-icon>person_remove</mat-icon></button>
        </td></ng-container>
        <tr mat-header-row *matHeaderRowDef="['name','actions']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['name','actions']"></tr>
      </table>

      <h2 class="mt-2">Subjects</h2>
      <button mat-stroked-button color="primary" (click)="manageSubjects()">Manage subjects</button>
      <table mat-table [dataSource]="d.subjects" class="mat-elevation-z1 mt-2">
        <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Subject</th><td mat-cell *matCellDef="let s">{{ s.name }}</td></ng-container>
        <tr mat-header-row *matHeaderRowDef="['name']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['name']"></tr>
      </table>

      <button mat-button class="mt-2" (click)="back()">Back</button>
    }
  `,
  styles: [`
    .mt-2{margin-top:16px}
    table{width:100%}
    .enroll-row{display:flex;gap:16px;align-items:flex-start;margin-bottom:8px}
    .grow{flex:1 1 300px}
  `]
})
export class ClassDetailComponent implements OnInit {
  private readonly svc = inject(ClassHttpService);
  private readonly studentSvc = inject(StudentHttpService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  @Input() id!: string;
  readonly detail = signal<ClassDetailDto | null>(null);
  readonly searchResults = signal<StudentSummaryDto[]>([]);
  studentSearch: string | StudentSummaryDto = '';
  selectedStudentId: string | null = null;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.reload();
  }

  reload() {
    this.svc.getById(this.id).subscribe(r => this.detail.set(r?.data ?? null));
  }

  searchStudents() {
    this.selectedStudentId = null;
    const term = typeof this.studentSearch === 'string' ? this.studentSearch : '';
    if (term.length < 2) { this.searchResults.set([]); return; }
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.studentSvc.getAll({ search: term, pageSize: 10 }).subscribe(r => {
        const enrolled = new Set(this.detail()?.students.map(s => s.id) ?? []);
        this.searchResults.set((r?.data ?? []).filter(s => !enrolled.has(s.id)));
      });
    }, 300);
  }

  displayStudent(s: StudentSummaryDto | string): string {
    return typeof s === 'string' ? s : s?.fullName ?? '';
  }

  selectStudent(s: StudentSummaryDto) {
    this.selectedStudentId = s.id;
  }

  async enroll() {
    if (!this.selectedStudentId) return;
    const r = await firstValueFrom(this.svc.enrollStudent(this.id, { studentId: this.selectedStudentId }));
    if (r?.success) {
      this.snack.open('Student enrolled', 'OK', { duration: 2500 });
      this.studentSearch = '';
      this.selectedStudentId = null;
      this.searchResults.set([]);
      this.reload();
    } else {
      this.snack.open(r?.message ?? 'Failed to enroll', 'OK', { duration: 4000 });
    }
  }

  async remove(studentId: string, name: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Remove student', message: `Remove '${name}' from this class?` }
    });
    ref.afterClosed().subscribe(async ok => {
      if (!ok) return;
      const r = await firstValueFrom(this.svc.removeStudent(this.id, studentId));
      if (r?.success) {
        this.snack.open('Student removed', 'OK', { duration: 2500 });
        this.reload();
      } else {
        this.snack.open(r?.message ?? 'Failed to remove', 'OK', { duration: 4000 });
      }
    });
  }

  manageSubjects() { this.router.navigate(['/admin/classes', this.id, 'subjects']); }
  back() { this.router.navigate(['/admin/classes']); }
}
