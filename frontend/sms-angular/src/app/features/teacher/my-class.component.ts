import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { TeacherHttpService } from '../../core/http/teacher-http.service';
import { ClassHttpService } from '../../core/http/class-http.service';
import { ClassDetailDto } from '../../core/models/class.model';

@Component({
  selector: 'app-my-class',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule],
  template: `
    <h1>My class</h1>
    @if (detail(); as d) {
      <mat-card>
        <mat-card-content>
          <h2>{{ d.name }}</h2>
          <p><strong>Grade level:</strong> {{ d.gradeLevel }}</p>
          <p><strong>Students:</strong> {{ d.studentCount }}</p>
        </mat-card-content>
      </mat-card>

      <h2 class="mt-2">Students</h2>
      <table mat-table [dataSource]="d.students" class="mat-elevation-z1">
        <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let s">{{ s.fullName }}</td></ng-container>
        <tr mat-header-row *matHeaderRowDef="['name']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['name']"></tr>
      </table>

      <h2 class="mt-2">Subjects</h2>
      <table mat-table [dataSource]="d.subjects" class="mat-elevation-z1">
        <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Subject</th><td mat-cell *matCellDef="let s">{{ s.name }}</td></ng-container>
        <tr mat-header-row *matHeaderRowDef="['name']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['name']"></tr>
      </table>
    } @else {
      <p>You are not assigned to any class.</p>
    }
  `,
  styles: [`.mt-2{margin-top:16px}table{width:100%}`]
})
export class MyClassComponent implements OnInit {
  private readonly teacherSvc = inject(TeacherHttpService);
  private readonly classSvc = inject(ClassHttpService);
  readonly detail = signal<ClassDetailDto | null>(null);

  ngOnInit(): void {
    this.teacherSvc.getMe().subscribe(r => {
      const cid = r?.data?.classId;
      if (cid) {
        this.classSvc.getById(cid).subscribe(c => this.detail.set(c?.data ?? null));
      }
    });
  }
}
