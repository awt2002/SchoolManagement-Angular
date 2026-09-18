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
import { ExamHttpService } from '../../core/http/exam-http.service';
import { TeacherHttpService } from '../../core/http/teacher-http.service';
import { ClassHttpService } from '../../core/http/class-http.service';
import { ExamDto, ExamScoreEntryDto } from '../../core/models/exam.model';
import { ClassStudentDto } from '../../core/models/class.model';

@Component({
  selector: 'app-exam-scores',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <button mat-button (click)="back()"><mat-icon>arrow_back</mat-icon> Back to exams</button>
    @if (exam(); as e) {
      <h1>{{ e.name }}</h1>
      <p>Subject: {{ e.subjectName }} — Max score: {{ e.maxScore }}</p>
      @if (students().length) {
        <mat-card>
          <mat-card-content>
            @for (st of students(); track st.id) {
              <div class="row">
                <div class="name">{{ st.fullName }}</div>
                <mat-form-field appearance="outline" class="score">
                  <mat-label>Score</mat-label>
                  <input matInput type="number" min="0" [max]="e.maxScore" [(ngModel)]="scores[st.id]">
                </mat-form-field>
              </div>
            }
          </mat-card-content>
          <mat-card-actions>
            <button mat-flat-button color="primary" (click)="save()">Save scores</button>
          </mat-card-actions>
        </mat-card>
      } @else {
        <p>No students in this class.</p>
      }
    }
  `,
  styles: [`.row{display:flex;gap:16px;align-items:center;margin-bottom:8px}.name{flex:1}.score{width:120px}`]
})
export class ExamScoresComponent implements OnInit {
  private readonly examSvc = inject(ExamHttpService);
  private readonly teacherSvc = inject(TeacherHttpService);
  private readonly classSvc = inject(ClassHttpService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  @Input() id!: string;
  readonly exam = signal<ExamDto | null>(null);
  readonly students = signal<ClassStudentDto[]>([]);
  scores: Record<string, number> = {};

  ngOnInit(): void {
    this.examSvc.getById(this.id).subscribe(r => this.exam.set(r?.data ?? null));
    this.teacherSvc.getMe().subscribe(r => {
      const cid = r?.data?.classId;
      if (!cid) return;
      this.classSvc.getById(cid).subscribe(c => {
        this.students.set(c?.data?.students ?? []);
        this.examSvc.getResults(this.id).subscribe(res => {
          for (const r of (res?.data ?? [])) {
            this.scores[r.studentId] = r.score;
          }
        });
      });
    });
  }

  async save() {
    const results: ExamScoreEntryDto[] = Object.entries(this.scores).map(([studentId, score]) => ({ studentId, score: Number(score) }));
    const r = await firstValueFrom(this.examSvc.createResults(this.id, { results }));
    if (r?.success) this.snack.open('Scores saved', 'OK', { duration: 2500 });
    else this.snack.open(r?.message ?? 'Failed', 'OK', { duration: 4000 });
  }

  back() { this.router.navigate(['/teacher/exams']); }
}
