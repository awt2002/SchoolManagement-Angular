import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { TeacherHttpService } from '../../core/http/teacher-http.service';
import { ExamHttpService } from '../../core/http/exam-http.service';
import { ExamDto } from '../../core/models/exam.model';

@Component({
  selector: 'app-teacher-exams',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatTableModule],
  template: `
    <div class="header-row">
      <h1>My exams</h1>
      <button mat-flat-button color="primary" (click)="create()">Create exam</button>
    </div>
    @if (exams().length) {
      <table mat-table [dataSource]="exams()" class="mat-elevation-z1">
        <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let e">{{ e.name }}</td></ng-container>
        <ng-container matColumnDef="subject"><th mat-header-cell *matHeaderCellDef>Subject</th><td mat-cell *matCellDef="let e">{{ e.subjectName }}</td></ng-container>
        <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let e">{{ e.examDate }}</td></ng-container>
        <ng-container matColumnDef="max"><th mat-header-cell *matHeaderCellDef>Max score</th><td mat-cell *matCellDef="let e">{{ e.maxScore }}</td></ng-container>
        <ng-container matColumnDef="pass"><th mat-header-cell *matHeaderCellDef>Passing %</th><td mat-cell *matCellDef="let e">{{ e.passingThreshold }}%</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let e">
          <button mat-button color="primary" (click)="scores(e.id)">Enter scores</button>
        </td></ng-container>
        <tr mat-header-row *matHeaderRowDef="['name','subject','date','max','pass','actions']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['name','subject','date','max','pass','actions']"></tr>
      </table>
    } @else {
      <p>No exams created yet.</p>
    }
  `,
  styles: [`.header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}table{width:100%}`]
})
export class TeacherExamsComponent implements OnInit {
  private readonly teacherSvc = inject(TeacherHttpService);
  private readonly examSvc = inject(ExamHttpService);
  private readonly router = inject(Router);
  readonly exams = signal<ExamDto[]>([]);

  ngOnInit(): void {
    this.teacherSvc.getMe().subscribe(r => {
      const cid = r?.data?.classId;
      if (cid) {
        this.examSvc.getAll({ classId: cid }).subscribe(e => this.exams.set(e?.data ?? []));
      }
    });
  }

  create() { this.router.navigate(['/teacher/exams/create']); }
  scores(id: string) { this.router.navigate(['/teacher/exams', id, 'scores']); }
}
