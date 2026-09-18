import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AttendanceHttpService } from '../../core/http/attendance-http.service';
import { ClassHttpService } from '../../core/http/class-http.service';
import { AttendanceRecordDto } from '../../core/models/attendance.model';
import { ClassDto } from '../../core/models/class.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatTableModule, MatButtonModule, MatIconModule],
  template: `
    <h1>Attendance records</h1>
    <mat-form-field appearance="outline" class="filter">
      <mat-label>Filter by class</mat-label>
      <mat-select [(ngModel)]="selectedClassId" (selectionChange)="load()">
        <mat-option [value]="null">All classes</mat-option>
        @for (c of classes(); track c.id) { <mat-option [value]="c.id">{{ c.name }}</mat-option> }
      </mat-select>
    </mat-form-field>

    <table mat-table [dataSource]="items()" class="mat-elevation-z1">
      <ng-container matColumnDef="student"><th mat-header-cell *matHeaderCellDef>Student</th><td mat-cell *matCellDef="let r">{{ r.studentName }}</td></ng-container>
      <ng-container matColumnDef="class"><th mat-header-cell *matHeaderCellDef>Class</th><td mat-cell *matCellDef="let r">{{ r.className }}</td></ng-container>
      <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Absence date</th><td mat-cell *matCellDef="let r">{{ r.absenceDate }}</td></ng-container>
      <ng-container matColumnDef="by"><th mat-header-cell *matHeaderCellDef>Recorded by</th><td mat-cell *matCellDef="let r">{{ r.recordedByName }}</td></ng-container>
      <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let r">
        <button mat-icon-button color="warn" (click)="del(r.id, r.studentName, r.absenceDate)"><mat-icon>delete</mat-icon></button>
      </td></ng-container>
      <tr mat-header-row *matHeaderRowDef="['student','class','date','by','actions']"></tr>
      <tr mat-row *matRowDef="let row; columns: ['student','class','date','by','actions']"></tr>
    </table>
  `,
  styles: [`.filter{margin-bottom:16px;min-width:300px}table{width:100%}`]
})
export class AdminAttendanceComponent implements OnInit {
  private readonly svc = inject(AttendanceHttpService);
  private readonly classSvc = inject(ClassHttpService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly items = signal<AttendanceRecordDto[]>([]);
  readonly classes = signal<ClassDto[]>([]);
  selectedClassId: string | null = null;

  ngOnInit(): void {
    this.classSvc.getAll().subscribe(r => this.classes.set(r?.data ?? []));
    this.load();
  }

  load() {
    this.svc.getAll({ classId: this.selectedClassId ?? undefined }).subscribe(r => this.items.set(r?.data ?? []));
  }

  async del(id: string, name: string, date: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Confirm deletion', message: `Delete absence for '${name}' on ${date}?` } });
    ref.afterClosed().subscribe(async ok => {
      if (!ok) return;
      await firstValueFrom(this.svc.delete(id));
      this.snack.open('Record deleted', 'OK', { duration: 2500 });
      this.load();
    });
  }
}
