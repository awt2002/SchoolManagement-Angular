import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubjectHttpService } from '../../core/http/subject-http.service';
import { ClassHttpService } from '../../core/http/class-http.service';
import { SubjectDto } from '../../core/models/subject.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-subject-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatTableModule, MatChipsModule
  ],
  template: `
    <button mat-button (click)="back()"><mat-icon>arrow_back</mat-icon> Back to class</button>
    <h1>Manage subjects — {{ className() }}</h1>

    <mat-card>
      <mat-card-content>
        <h3>Add subject</h3>
        <div class="row">
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Subject name</mat-label>
            <input matInput [(ngModel)]="newSubjectName">
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="createSubject()">Add subject</button>
        </div>
      </mat-card-content>
    </mat-card>

    @for (s of subjects(); track s.id) {
      <mat-card class="mt-2">
        <mat-card-header>
          <mat-card-title>{{ s.name }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (s.gradeCategories.length) {
            <table mat-table [dataSource]="s.gradeCategories" class="mb-2">
              <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Category</th><td mat-cell *matCellDef="let c">{{ c.name }}</td></ng-container>
              <ng-container matColumnDef="weight"><th mat-header-cell *matHeaderCellDef>Weight (%)</th><td mat-cell *matCellDef="let c">{{ c.weight }}%</td></ng-container>
              <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let c">
                <button mat-icon-button color="warn" (click)="delCategory(s.id, c.id, c.name)"><mat-icon>delete</mat-icon></button>
              </td></ng-container>
              <tr mat-header-row *matHeaderRowDef="['name','weight','actions']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['name','weight','actions']"></tr>
            </table>
            <p>
              Total weight: {{ weightSum(s) }}%
              @if (weightSum(s) !== 100) {
                <mat-chip color="warn" highlighted>Must equal 100%</mat-chip>
              } @else {
                <mat-chip color="primary" highlighted>Valid</mat-chip>
              }
            </p>
          }
          <div class="row">
            <mat-form-field appearance="outline"><mat-label>Category name</mat-label><input matInput [(ngModel)]="catName[s.id]"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Weight %</mat-label><input matInput type="number" min="1" max="100" [(ngModel)]="catWeight[s.id]"></mat-form-field>
            <button mat-stroked-button color="primary" (click)="addCategory(s.id)">Add category</button>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button color="warn" (click)="delSubject(s.id, s.name)">Delete subject</button>
        </mat-card-actions>
      </mat-card>
    }
  `,
  styles: [`
    .row { display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap; }
    .grow { flex: 1 1 300px; }
    .mb-2 { margin-bottom: 16px; }
    .mt-2 { margin-top: 16px; }
    table { width: 100%; }
  `]
})
export class SubjectManagementComponent implements OnInit {
  private readonly svc = inject(SubjectHttpService);
  private readonly classSvc = inject(ClassHttpService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  @Input() id!: string;
  readonly subjects = signal<SubjectDto[]>([]);
  readonly className = signal<string>('');

  newSubjectName = '';
  catName: Record<string, string> = {};
  catWeight: Record<string, number> = {};

  ngOnInit(): void {
    this.classSvc.getById(this.id).subscribe(r => this.className.set(r?.data?.name ?? ''));
    this.load();
  }

  load() {
    this.svc.getAll(this.id).subscribe(r => {
      this.subjects.set(r?.data ?? []);
    });
  }

  weightSum(s: SubjectDto): number {
    return s.gradeCategories.reduce((a, c) => a + Number(c.weight), 0);
  }

  async createSubject() {
    if (!this.newSubjectName.trim()) return;
    const r = await firstValueFrom(this.svc.create({ name: this.newSubjectName, classId: this.id }));
    if (r?.success) { this.snack.open('Subject created', 'OK', { duration: 2500 }); this.newSubjectName = ''; this.load(); }
  }

  async addCategory(subjectId: string) {
    const name = this.catName[subjectId];
    const weight = Number(this.catWeight[subjectId] ?? 0);
    if (!name || weight <= 0) return;
    const r = await firstValueFrom(this.svc.createCategory(subjectId, { name, weight }));
    if (r?.success) {
      this.catName[subjectId] = '';
      this.catWeight[subjectId] = 0;
      this.snack.open('Category added', 'OK', { duration: 2500 });
      this.load();
    } else {
      this.snack.open(r?.message ?? 'Failed', 'OK', { duration: 4000 });
    }
  }

  async delSubject(subjectId: string, name: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Confirm deletion', message: `Delete subject '${name}'?` } });
    ref.afterClosed().subscribe(async ok => {
      if (!ok) return;
      const r = await firstValueFrom(this.svc.delete(subjectId));
      if (r?.success) { this.snack.open('Subject deleted', 'OK', { duration: 2500 }); this.load(); }
      else { this.snack.open(r?.message ?? 'Failed', 'OK', { duration: 4000 }); }
    });
  }

  async delCategory(subjectId: string, categoryId: string, name: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Confirm deletion', message: `Delete category '${name}'?` } });
    ref.afterClosed().subscribe(async ok => {
      if (!ok) return;
      const r = await firstValueFrom(this.svc.deleteCategory(subjectId, categoryId));
      if (r?.success) { this.snack.open('Category deleted', 'OK', { duration: 2500 }); this.load(); }
      else { this.snack.open(r?.message ?? 'Failed', 'OK', { duration: 4000 }); }
    });
  }

  back() { this.router.navigate(['/admin/classes', this.id]); }
}
