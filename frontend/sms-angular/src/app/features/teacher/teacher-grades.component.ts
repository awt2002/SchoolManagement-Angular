import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { TeacherHttpService } from '../../core/http/teacher-http.service';
import { ClassHttpService } from '../../core/http/class-http.service';
import { ClassSubjectDto } from '../../core/models/class.model';

@Component({
  selector: 'app-teacher-grades',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule],
  template: `
    <h1>Grades — choose a subject</h1>
    <table mat-table [dataSource]="subjects()" class="mat-elevation-z1">
      <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Subject</th><td mat-cell *matCellDef="let s">{{ s.name }}</td></ng-container>
      <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let s">
        <button mat-button color="primary" (click)="open(s.id)">Enter grades</button>
      </td></ng-container>
      <tr mat-header-row *matHeaderRowDef="['name','actions']"></tr>
      <tr mat-row *matRowDef="let row; columns: ['name','actions']"></tr>
    </table>
  `,
  styles: [`table{width:100%}`]
})
export class TeacherGradesComponent implements OnInit {
  private readonly teacherSvc = inject(TeacherHttpService);
  private readonly classSvc = inject(ClassHttpService);
  private readonly router = inject(Router);
  readonly subjects = signal<ClassSubjectDto[]>([]);

  ngOnInit(): void {
    this.teacherSvc.getMe().subscribe(r => {
      const cid = r?.data?.classId;
      if (cid) {
        this.classSvc.getById(cid).subscribe(c => this.subjects.set(c?.data?.subjects ?? []));
      }
    });
  }

  open(subjectId: string) { this.router.navigate(['/teacher/grades', subjectId]); }
}
