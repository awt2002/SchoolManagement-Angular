import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClassHttpService } from '../../core/http/class-http.service';
import { ClassDto } from '../../core/models/class.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTableModule],
  template: `
    <div class="header-row">
      <h1>Classes</h1>
      <button mat-flat-button color="primary" (click)="create()">Add class</button>
    </div>
    <table mat-table [dataSource]="items()" class="mat-elevation-z1">
      <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let c">{{ c.name }}</td></ng-container>
      <ng-container matColumnDef="grade"><th mat-header-cell *matHeaderCellDef>Grade level</th><td mat-cell *matCellDef="let c">{{ c.gradeLevel }}</td></ng-container>
      <ng-container matColumnDef="teacher"><th mat-header-cell *matHeaderCellDef>Teacher</th><td mat-cell *matCellDef="let c">{{ c.teacherName || 'Not assigned' }}</td></ng-container>
      <ng-container matColumnDef="students"><th mat-header-cell *matHeaderCellDef>Students</th><td mat-cell *matCellDef="let c">{{ c.studentCount }}</td></ng-container>
      <ng-container matColumnDef="year"><th mat-header-cell *matHeaderCellDef>Academic year</th><td mat-cell *matCellDef="let c">{{ c.academicYearName }}</td></ng-container>
      <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let c">
        <button mat-icon-button (click)="edit(c.id)"><mat-icon>edit</mat-icon></button>
        <button mat-icon-button (click)="view(c.id)"><mat-icon>visibility</mat-icon></button>
        <button mat-icon-button color="warn" (click)="del(c.id, c.name)"><mat-icon>delete</mat-icon></button>
      </td></ng-container>
      <tr mat-header-row *matHeaderRowDef="displayed"></tr>
      <tr mat-row *matRowDef="let row; columns: displayed"></tr>
    </table>
  `,
  styles: [`.header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}table{width:100%}`]
})
export class ClassesComponent implements OnInit {
  private readonly svc = inject(ClassHttpService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly items = signal<ClassDto[]>([]);
  displayed = ['name', 'grade', 'teacher', 'students', 'year', 'actions'];

  ngOnInit(): void { this.load(); }

  load() { this.svc.getAll().subscribe(r => this.items.set(r?.data ?? [])); }
  create() { this.router.navigate(['/admin/classes/create']); }
  edit(id: string) { this.router.navigate(['/admin/classes', id, 'edit']); }
  view(id: string) { this.router.navigate(['/admin/classes', id]); }

  async del(id: string, name: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Confirm deletion', message: `Delete class '${name}'?` } });
    ref.afterClosed().subscribe(async ok => {
      if (!ok) return;
      const r = await firstValueFrom(this.svc.delete(id));
      if (r?.success) { this.snack.open('Class deleted', 'OK', { duration: 2500 }); this.load(); }
      else {
        const msg = (r?.errors && r.errors.length) ? r.errors.join(', ') : (r?.message ?? 'Failed');
        this.snack.open(msg, 'OK', { duration: 4000 });
      }
    });
  }
}
