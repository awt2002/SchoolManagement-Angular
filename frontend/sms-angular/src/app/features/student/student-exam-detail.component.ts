import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StudentHttpService } from '../../core/http/student-http.service';
import { ExamHttpService } from '../../core/http/exam-http.service';
import { ExamDto, ExamResultDetailDto } from '../../core/models/exam.model';

@Component({
  selector: 'app-student-exam-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <button mat-button (click)="back()"><mat-icon>arrow_back</mat-icon> Back to exams</button>
    @if (exam(); as e) {
      <h1>{{ e.name }}</h1>
      <p>Subject: {{ e.subjectName }} — Date: {{ e.examDate }}</p>
      @if (result(); as r) {
        <div class="grid">
          <mat-card><mat-card-content><div class="big primary">{{ r.score }} / {{ e.maxScore }}</div><div>Your score</div></mat-card-content></mat-card>
          <mat-card><mat-card-content><div class="big info">{{ r.percentage | number:'1.1-1' }}%</div><div>Percentage</div></mat-card-content></mat-card>
          <mat-card><mat-card-content><div class="big" [class.pass]="r.passed" [class.fail]="!r.passed">{{ r.passed ? 'PASS' : 'FAIL' }}</div><div>Status</div></mat-card-content></mat-card>
          <mat-card><mat-card-content><div class="big accent">{{ r.average | number:'1.1-1' }}</div><div>Average</div></mat-card-content></mat-card>
        </div>
        <mat-card class="mt-2">
          <mat-card-content>
            <h3>Analytics</h3>
            <p><strong>Highest:</strong> {{ r.highest }}</p>
            <p><strong>Lowest:</strong> {{ r.lowest }}</p>
            <p><strong>Passing threshold:</strong> {{ e.passingThreshold }}%</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <p>No result recorded for this exam yet.</p>
      }
    }
  `,
  styles: [`
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-top:16px}
    .big{font-size:32px;font-weight:600;text-align:center}
    .primary{color:#1976d2}.info{color:#0288d1}.accent{color:#7c3aed}
    .pass{color:#2e7d32}.fail{color:#d32f2f}
    .mt-2{margin-top:16px}
    mat-card-content>div:last-child{text-align:center}
  `]
})
export class StudentExamDetailComponent implements OnInit {
  private readonly examSvc = inject(ExamHttpService);
  private readonly studentSvc = inject(StudentHttpService);
  private readonly router = inject(Router);

  @Input() id!: string;
  readonly exam = signal<ExamDto | null>(null);
  readonly result = signal<ExamResultDetailDto | null>(null);

  ngOnInit(): void {
    this.examSvc.getById(this.id).subscribe(r => this.exam.set(r?.data ?? null));
    this.studentSvc.getMyProfile().subscribe(r => {
      const sid = r?.data?.id;
      if (sid) {
        this.examSvc.getStudentResult(this.id, sid).subscribe(res => this.result.set(res?.data ?? null));
      }
    });
  }

  back() { this.router.navigate(['/student/exams']); }
}
