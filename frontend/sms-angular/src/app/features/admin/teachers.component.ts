import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeacherHttpService } from '../../core/http/teacher-http.service';
import { TeacherDto } from '../../core/models/teacher.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatTableModule, MatSlideToggleModule, MatChipsModule
  ],
  template: `
    <div class="header-row">
      <h1>Teachers</h1>
      <button mat-flat-button color="primary" (click)="create()">Add teacher</button>
    </div>
    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Search</mat-label>
        <input matInput [(ngModel)]="search" (keyup.enter)="load()">
      </mat-form-field>
      <mat-slide-toggle [(ngModel)]="includeInactive" (change)="load()">Show inactive</mat-slide-toggle>
    </div>
    <table mat-table [dataSource]="items()" class="mat-elevation-z1">
      <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let t">{{ t.fullName }}</td></ng-container>
      <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>Email</th><td mat-cell *matCellDef="let t">{{ t.email }}</td></ng-container>
      <ng-container matColumnDef="class"><th mat-header-cell *matHeaderCellDef>Class</th><td mat-cell *matCellDef="let t">{{ t.assignedClassName || 'Not assigned' }}</td></ng-container>
      <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let t"><mat-chip [color]="t.isActive ? 'primary' : 'warn'" highlighted>{{ t.isActive ? 'Active' : 'Inactive' }}</mat-chip></td></ng-container>
      <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let t">
        <button mat-icon-button (click)="edit(t.id)"><mat-icon>edit</mat-icon></button>
        @if (t.isActive) { <button mat-icon-button color="warn" (click)="deactivate(t.id, t.fullName)"><mat-icon>delete</mat-icon></button> }
        @else { <button mat-icon-button color="primary" (click)="reactivate(t.id)"><mat-icon>restore_from_trash</mat-icon></button> }
      </td></ng-container>
      <tr mat-header-row *matHeaderRowDef="displayed"></tr>
      <tr mat-row *matRowDef="let row; columns: displayed"></tr>
    </table>
  `,
  styles: [`.header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.filters{display:flex;gap:16px;align-items:center;margin-bottom:16px}table{width:100%}`]
})
export class TeachersComponent implements OnInit {
  private readonly svc = inject(TeacherHttpService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly items = signal<TeacherDto[]>([]);
  search = '';
  includeInactive = false;
  displayed = ['name', 'email', 'class', 'status', 'actions'];

  ngOnInit(): void { this.load(); }

  load() {
    this.svc.getAll({ page: 1, pageSize: 100, search: this.search || undefined, includeInactive: this.includeInactive })
      .subscribe(r => this.items.set(r?.data ?? []));
  }

  create() { this.router.navigate(['/admin/teachers/create']); }
  edit(id: string) { this.router.navigate(['/admin/teachers', id, 'edit']); }

  async deactivate(id: string, name: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Confirm deactivation', message: `Deactivate teacher '${name}'?` } });
    ref.afterClosed().subscribe(async ok => {
      if (!ok) return;
      await firstValueFrom(this.svc.delete(id));
      this.snack.open('Teacher deactivated', 'OK', { duration: 2500 });
      this.load();
    });
  }

  async reactivate(id: string) {
    await firstValueFrom(this.svc.reactivate(id));
    this.snack.open('Teacher reactivated', 'OK', { duration: 2500 });
    this.load();
  }
}
