import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { StudentHttpService } from '../../core/http/student-http.service';
import { StudentDetailDto } from '../../core/models/student.model';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, MatChipsModule],
  template: `
    @if (student(); as s) {
      <h1>{{ s.fullName }}</h1>
      <mat-card>
        <mat-card-content>
          <p><strong>Date of birth:</strong> {{ s.dateOfBirth }}</p>
          <p><strong>Address:</strong> {{ s.address }}</p>
          <p><strong>Enrollment year:</strong> {{ s.enrollmentYear }}</p>
          <p><strong>Status:</strong>
            <mat-chip [color]="s.isActive ? 'primary' : 'warn'" highlighted>
              {{ s.isActive ? 'Active' : 'Inactive' }}
            </mat-chip>
          </p>
          <p><strong>Parent:</strong> {{ s.parentName }} ({{ s.parentEmail }})</p>
          <p><strong>Parent phone:</strong> {{ s.parentPhone }}</p>
        </mat-card-content>
      </mat-card>

      <h2 class="mt-2">Enrollment history</h2>
      <table mat-table [dataSource]="s.enrollments" class="mat-elevation-z1">
        <ng-container matColumnDef="class">
          <th mat-header-cell *matHeaderCellDef>Class</th>
          <td mat-cell *matCellDef="let e">{{ e.className }}</td>
        </ng-container>
        <ng-container matColumnDef="year">
          <th mat-header-cell *matHeaderCellDef>Academic year</th>
          <td mat-cell *matCellDef="let e">{{ e.academicYearName }}</td>
        </ng-container>
        <ng-container matColumnDef="enrolled">
          <th mat-header-cell *matHeaderCellDef>Enrolled at</th>
          <td mat-cell *matCellDef="let e">{{ e.enrolledAt | date:'short' }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="['class','year','enrolled']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['class','year','enrolled']"></tr>
      </table>

      <div class="mt-2">
        <button mat-flat-button color="primary" (click)="edit()">Edit</button>
        <button mat-button (click)="back()">Back</button>
      </div>
    }
  `,
  styles: [`
    .mt-2 { margin-top: 16px; }
    table { width: 100%; }
  `]
})
export class StudentDetailComponent implements OnInit {
  private readonly svc = inject(StudentHttpService);
  private readonly router = inject(Router);

  @Input() id!: string;
  readonly student = signal<StudentDetailDto | null>(null);

  ngOnInit(): void {
    this.svc.getById(this.id).subscribe(r => this.student.set(r?.data ?? null));
  }

  edit() { this.router.navigate(['/admin/students', this.id, 'edit']); }
  back() { this.router.navigate(['/admin/students']); }
}
