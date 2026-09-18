import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { StudentHttpService } from '../../core/http/student-http.service';
import { GradeHttpService } from '../../core/http/grade-http.service';
import { GradeDto, GradeSummaryDto } from '../../core/models/grade.model';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule],
  template: `
    <h1>My grades</h1>
    @if (summary(); as s) {
      <mat-card>
        <mat-card-content class="text-center">
          <div class="big-number">{{ s.gpa | number:'1.2-2' }}</div>
          <div>Overall GPA</div>
        </mat-card-content>
      </mat-card>

      @if (s.subjectAverages.length) {
        <h2 class="mt-2">Subject averages</h2>
        <table mat-table [dataSource]="s.subjectAverages" class="mat-elevation-z1">
          <ng-container matColumnDef="subject"><th mat-header-cell *matHeaderCellDef>Subject</th><td mat-cell *matCellDef="let x">{{ x.subjectName }}</td></ng-container>
          <ng-container matColumnDef="avg"><th mat-header-cell *matHeaderCellDef>Weighted average</th><td mat-cell *matCellDef="let x">{{ x.weightedAverage | number:'1.2-2' }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="['subject','avg']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['subject','avg']"></tr>
        </table>
      }
    }

    @if (grades().length) {
      <h2 class="mt-2">Detailed grades</h2>
      <table mat-table [dataSource]="grades()" class="mat-elevation-z1">
        <ng-container matColumnDef="subject"><th mat-header-cell *matHeaderCellDef>Subject</th><td mat-cell *matCellDef="let g">{{ g.subjectName }}</td></ng-container>
        <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>Category</th><td mat-cell *matCellDef="let g">{{ g.categoryName }}</td></ng-container>
        <ng-container matColumnDef="score"><th mat-header-cell *matHeaderCellDef>Score</th><td mat-cell *matCellDef="let g">{{ g.score }}</td></ng-container>
        <ng-container matColumnDef="w"><th mat-header-cell *matHeaderCellDef>Weighted contribution</th><td mat-cell *matCellDef="let g">{{ g.weightedContribution | number:'1.2-2' }}</td></ng-container>
        <tr mat-header-row *matHeaderRowDef="['subject','category','score','w']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['subject','category','score','w']"></tr>
      </table>
    }
  `,
  styles: [`.text-center{text-align:center}.big-number{font-size:42px;font-weight:600;color:#1976d2}.mt-2{margin-top:16px}table{width:100%}`]
})
export class StudentGradesComponent implements OnInit {
  private readonly studentSvc = inject(StudentHttpService);
  private readonly gradeSvc = inject(GradeHttpService);
  readonly summary = signal<GradeSummaryDto | null>(null);
  readonly grades = signal<GradeDto[]>([]);

  ngOnInit(): void {
    this.studentSvc.getMyProfile().subscribe(r => {
      const id = r?.data?.id;
      if (!id) return;
      this.gradeSvc.getSummary({ studentId: id }).subscribe(s => this.summary.set(s?.data ?? null));
      this.gradeSvc.getAll({ studentId: id }).subscribe(g => this.grades.set(g?.data ?? []));
    });
  }
}
