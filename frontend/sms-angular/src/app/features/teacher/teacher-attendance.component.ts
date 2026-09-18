import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeacherHttpService } from '../../core/http/teacher-http.service';
import { ClassHttpService } from '../../core/http/class-http.service';
import { AttendanceHttpService } from '../../core/http/attendance-http.service';
import { ClassDetailDto } from '../../core/models/class.model';
import { AttendanceRecordDto } from '../../core/models/attendance.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatCheckboxModule, MatDatepickerModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatTableModule, MatIconModule
  ],
  template: `
    <h1>Record attendance</h1>
    @if (detail(); as d) {
      <mat-card>
        <mat-card-content>
          <h2>{{ d.name }}</h2>
          <mat-form-field appearance="outline">
            <mat-label>Absence date</mat-label>
            <input matInput [matDatepicker]="dp" [(ngModel)]="absenceDate">
            <mat-datepicker-toggle matIconSuffix [for]="dp" />
            <mat-datepicker #dp />
          </mat-form-field>
          <div class="students">
            @for (s of d.students; track s.id) {
              <mat-checkbox [(ngModel)]="selected[s.id]">{{ s.fullName }}</mat-checkbox>
            }
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="record()">Record absences</button>
        </mat-card-actions>
      </mat-card>

      <h2 class="mt-2">Recent records</h2>
      <table mat-table [dataSource]="records()" class="mat-elevation-z1">
        <ng-container matColumnDef="student"><th mat-header-cell *matHeaderCellDef>Student</th><td mat-cell *matCellDef="let r">{{ r.studentName }}</td></ng-container>
        <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let r">{{ r.absenceDate }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let r">
          <button mat-icon-button color="warn" (click)="del(r.id, r.studentName, r.absenceDate)"><mat-icon>delete</mat-icon></button>
        </td></ng-container>
        <tr mat-header-row *matHeaderRowDef="['student','date','actions']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['student','date','actions']"></tr>
      </table>
    } @else {
      <p>You are not assigned to any class.</p>
    }
  `,
  styles: [`.students{display:flex;flex-direction:column;gap:4px;margin-top:8px}.mt-2{margin-top:16px}table{width:100%}`]
})
export class TeacherAttendanceComponent implements OnInit {
  private readonly teacherSvc = inject(TeacherHttpService);
  private readonly classSvc = inject(ClassHttpService);
  private readonly svc = inject(AttendanceHttpService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly detail = signal<ClassDetailDto | null>(null);
  readonly records = signal<AttendanceRecordDto[]>([]);
  classId: string | null = null;
  absenceDate: Date = new Date();
  selected: Record<string, boolean> = {};

  ngOnInit(): void {
    this.teacherSvc.getMe().subscribe(r => {
      this.classId = r?.data?.classId ?? null;
      if (this.classId) {
        this.classSvc.getById(this.classId).subscribe(c => this.detail.set(c?.data ?? null));
        this.loadRecords();
      }
    });
  }

  loadRecords() {
    if (!this.classId) return;
    this.svc.getAll({ classId: this.classId }).subscribe(r => this.records.set(r?.data ?? []));
  }

  async record() {
    if (!this.classId) return;
    const iso = this.absenceDate.toISOString().substring(0, 10);
    const requests = Object.entries(this.selected)
      .filter(([, absent]) => absent)
      .map(([studentId]) => this.svc.create({ studentId, classId: this.classId!, absenceDate: iso }));

    if (requests.length === 0) return;
    await firstValueFrom(forkJoin(requests));
    this.snack.open('Absences recorded', 'OK', { duration: 2500 });
    this.selected = {};
    this.loadRecords();
  }

  async del(id: string, name: string, date: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Confirm deletion', message: `Delete absence for '${name}' on ${date}?` } });
    ref.afterClosed().subscribe(async ok => {
      if (!ok) return;
      await firstValueFrom(this.svc.delete(id));
      this.snack.open('Deleted', 'OK', { duration: 2500 });
      this.loadRecords();
    });
  }
}
