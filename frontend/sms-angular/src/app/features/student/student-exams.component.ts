import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { StudentHttpService } from '../../core/http/student-http.service';
import { ExamHttpService } from '../../core/http/exam-http.service';
import { ExamDto } from '../../core/models/exam.model';

@Component({
  selector: 'app-student-exams',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatTableModule],
  template: `
    <h1>My exams</h1>
    @if (exams().length) {
      <table mat-table [dataSource]="exams()" class="mat-elevation-z1">
        <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Exam</th><td mat-cell *matCellDef="let e">{{ e.name }}</td></ng-container>
        <ng-container matColumnDef="subject"><th mat-header-cell *matHeaderCellDef>Subject</th><td mat-cell *matCellDef="let e">{{ e.subjectName }}</td></ng-container>
        <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let e">{{ e.examDate }}</td></ng-container>
        <ng-container matColumnDef="max"><th mat-header-cell *matHeaderCellDef>Max score</th><td mat-cell *matCellDef="let e">{{ e.maxScore }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let e">
          <button mat-button color="primary" (click)="open(e.id)">View result</button>
        </td></ng-container>
        <tr mat-header-row *matHeaderRowDef="['name','subject','date','max','actions']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['name','subject','date','max','actions']"></tr>
      </table>
    } @else {
      <p>No exams available.</p>
    }
  `,
  styles: [`table{width:100%}`]
})
export class StudentExamsComponent implements OnInit {
  private readonly studentSvc = inject(StudentHttpService);
  private readonly examSvc = inject(ExamHttpService);
  private readonly router = inject(Router);
  readonly exams = signal<ExamDto[]>([]);

  ngOnInit(): void {
    this.studentSvc.getMyProfile().subscribe(r => {
      const cid = r?.data?.currentClassId;
      if (cid) {
        this.examSvc.getAll({ classId: cid }).subscribe(e => this.exams.set(e?.data ?? []));
      }
    });
  }

  open(id: string) { this.router.navigate(['/student/exams', id]); }
}
