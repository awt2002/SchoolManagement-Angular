import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeacherHttpService } from '../../core/http/teacher-http.service';
import { ClassHttpService } from '../../core/http/class-http.service';
import { ExamHttpService } from '../../core/http/exam-http.service';
import { ClassSubjectDto } from '../../core/models/class.model';

@Component({
  selector: 'app-create-exam',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatButtonModule
  ],
  template: `
    <h1>Create exam</h1>
    @if (subjects().length) {
      <mat-card>
        <mat-card-content class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Exam name</mat-label><input matInput [(ngModel)]="name"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Subject</mat-label>
            <mat-select [(ngModel)]="subjectId">
              @for (s of subjects(); track s.id) { <mat-option [value]="s.id">{{ s.name }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Exam date</mat-label>
            <input matInput [matDatepicker]="dp" [(ngModel)]="examDate">
            <mat-datepicker-toggle matIconSuffix [for]="dp" />
            <mat-datepicker #dp />
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Max score</mat-label><input matInput type="number" min="1" [(ngModel)]="maxScore"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Passing threshold (%)</mat-label><input matInput type="number" min="0" max="100" [(ngModel)]="passingThreshold"></mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="submit()">Create exam</button>
          <button mat-button (click)="cancel()">Cancel</button>
        </mat-card-actions>
      </mat-card>
    } @else {
      <p>No subjects found for your class. Please contact an admin.</p>
    }
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:700px){.form-grid{grid-template-columns:1fr}}`]
})
export class CreateExamComponent implements OnInit {
  private readonly teacherSvc = inject(TeacherHttpService);
  private readonly classSvc = inject(ClassHttpService);
  private readonly examSvc = inject(ExamHttpService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly subjects = signal<ClassSubjectDto[]>([]);
  name = '';
  subjectId = '';
  examDate: Date = new Date();
  maxScore = 100;
  passingThreshold = 50;

  ngOnInit(): void {
    this.teacherSvc.getMe().subscribe(r => {
      const cid = r?.data?.classId;
      if (cid) {
        this.classSvc.getById(cid).subscribe(c => {
          const list = c?.data?.subjects ?? [];
          this.subjects.set(list);
          if (list.length) this.subjectId = list[0].id;
        });
      }
    });
  }

  async submit() {
    if (!this.name || !this.subjectId || !this.examDate) {
      this.snack.open('Please fill in required fields', 'OK', { duration: 3000 });
      return;
    }
    const r = await firstValueFrom(this.examSvc.create({
      name: this.name,
      subjectId: this.subjectId,
      examDate: this.examDate.toISOString().substring(0, 10),
      maxScore: this.maxScore,
      passingThreshold: this.passingThreshold
    }));
    if (r?.success) { this.snack.open('Exam created', 'OK', { duration: 2500 }); this.router.navigate(['/teacher/exams']); }
    else { this.snack.open(r?.message ?? 'Failed', 'OK', { duration: 4000 }); }
  }

  cancel() { this.router.navigate(['/teacher/exams']); }
}
