import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubjectHttpService } from '../../core/http/subject-http.service';
import { TeacherHttpService } from '../../core/http/teacher-http.service';
import { ClassHttpService } from '../../core/http/class-http.service';
import { GradeHttpService } from '../../core/http/grade-http.service';
import { SubjectDto } from '../../core/models/subject.model';
import { ClassStudentDto } from '../../core/models/class.model';

@Component({
  selector: 'app-teacher-grade-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <button mat-button (click)="back()"><mat-icon>arrow_back</mat-icon> Back to grades</button>
    @if (subject(); as s) {
      <h1>Grades — {{ s.name }}</h1>
      @for (cat of s.gradeCategories; track cat.id) {
        <mat-card class="mt-2">
          <mat-card-header>
            <mat-card-title>{{ cat.name }} ({{ cat.weight }}%)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @for (st of students(); track st.id) {
              <div class="row">
                <div class="name">{{ st.fullName }}</div>
                <mat-form-field appearance="outline" class="score">
                  <mat-label>Score</mat-label>
                  <input matInput type="number" min="0" max="100" [(ngModel)]="scores[st.id + '_' + cat.id]">
                </mat-form-field>
              </div>
            }
          </mat-card-content>
          <mat-card-actions>
            <button mat-stroked-button color="primary" (click)="save(cat.id)">Save {{ cat.name }}</button>
          </mat-card-actions>
        </mat-card>
      }
    }
  `,
  styles: [`.mt-2{margin-top:16px}.row{display:flex;gap:16px;align-items:center;margin-bottom:8px}.name{flex:1}.score{width:120px}`]
})
export class TeacherGradeDetailComponent implements OnInit {
  private readonly subjectSvc = inject(SubjectHttpService);
  private readonly teacherSvc = inject(TeacherHttpService);
  private readonly classSvc = inject(ClassHttpService);
  private readonly gradeSvc = inject(GradeHttpService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  @Input() subjectId!: string;
  readonly subject = signal<SubjectDto | null>(null);
  readonly students = signal<ClassStudentDto[]>([]);
  scores: Record<string, number> = {};

  ngOnInit(): void {
    this.subjectSvc.getById(this.subjectId).subscribe(r => this.subject.set(r?.data ?? null));
    this.teacherSvc.getMe().subscribe(r => {
      const cid = r?.data?.classId;
      if (!cid) return;
      this.classSvc.getById(cid).subscribe(c => {
        this.students.set(c?.data?.students ?? []);
        this.gradeSvc.getAll({ subjectId: this.subjectId }).subscribe(g => {
          for (const grade of (g?.data ?? [])) {
            this.scores[`${grade.studentId}_${grade.gradeCategoryId}`] = grade.score;
          }
        });
      });
    });
  }

  async save(categoryId: string) {
    for (const st of this.students()) {
      const key = `${st.id}_${categoryId}`;
      const score = Number(this.scores[key] ?? 0);
      if (score > 0) {
        await firstValueFrom(this.gradeSvc.createOrUpdate({ studentId: st.id, gradeCategoryId: categoryId, score }));
      }
    }
    this.snack.open('Grades saved', 'OK', { duration: 2500 });
  }

  back() { this.router.navigate(['/teacher/grades']); }
}
