import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { StudentHttpService } from '../../core/http/student-http.service';
import { AttendanceHttpService } from '../../core/http/attendance-http.service';
import { AttendanceSummaryDto } from '../../core/models/attendance.model';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule],
  template: `
    <h1>My attendance</h1>
    @if (summary(); as s) {
      <mat-card>
        <mat-card-content class="text-center">
          <div class="big-number">{{ s.totalAbsences }}</div>
          <div>Total absences this year</div>
        </mat-card-content>
      </mat-card>

      @if (s.absenceDates.length) {
        <h2 class="mt-2">Absence dates</h2>
        <table mat-table [dataSource]="s.absenceDates" class="mat-elevation-z1">
          <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let d">{{ d }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="['date']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['date']"></tr>
        </table>
      } @else {
        <p>No absences recorded. Great job!</p>
      }
    }
  `,
  styles: [`
    .text-center{text-align:center}
    .big-number{font-size:42px;font-weight:600;color:#f57c00}
    .mt-2{margin-top:16px}
    table{width:100%}
  `]
})
export class StudentAttendanceComponent implements OnInit {
  private readonly studentSvc = inject(StudentHttpService);
  private readonly svc = inject(AttendanceHttpService);
  readonly summary = signal<AttendanceSummaryDto | null>(null);

  ngOnInit(): void {
    this.studentSvc.getMyProfile().subscribe(r => {
      const id = r?.data?.id;
      if (id) this.svc.getStudentSummary(id).subscribe(s => this.summary.set(s?.data ?? null));
    });
  }
}
