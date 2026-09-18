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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StudentHttpService } from '../../core/http/student-http.service';
import { StudentSummaryDto } from '../../core/models/student.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatTableModule, MatSlideToggleModule,
    MatChipsModule, MatPaginatorModule
  ],
  template: `
    <div class="header-row">
      <h1>Students</h1>
      <button mat-flat-button color="primary" (click)="create()">Add student</button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Search by name</mat-label>
        <input matInput [(ngModel)]="search" (keyup.enter)="reload()">
      </mat-form-field>
      <mat-slide-toggle [(ngModel)]="includeInactive" (change)="reload()">Show inactive</mat-slide-toggle>
    </div>

    <table mat-table [dataSource]="items()" class="mat-elevation-z1">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let s">{{ s.fullName }}</td>
      </ng-container>
      <ng-container matColumnDef="dob">
        <th mat-header-cell *matHeaderCellDef>Date of birth</th>
        <td mat-cell *matCellDef="let s">{{ s.dateOfBirth }}</td>
      </ng-container>
      <ng-container matColumnDef="class">
        <th mat-header-cell *matHeaderCellDef>Class</th>
        <td mat-cell *matCellDef="let s">{{ s.className }}</td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let s">
          <mat-chip [color]="s.isActive ? 'primary' : 'warn'" highlighted>
            {{ s.isActive ? 'Active' : 'Inactive' }}
          </mat-chip>
        </td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let s">
          <button mat-icon-button (click)="view(s.id)"><mat-icon>visibility</mat-icon></button>
          <button mat-icon-button (click)="edit(s.id)"><mat-icon>edit</mat-icon></button>
          @if (s.isActive) {
            <button mat-icon-button color="warn" (click)="deactivate(s.id, s.fullName)"><mat-icon>delete</mat-icon></button>
          } @else {
            <button mat-icon-button color="primary" (click)="reactivate(s.id)"><mat-icon>restore_from_trash</mat-icon></button>
          }
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="displayed"></tr>
      <tr mat-row *matRowDef="let row; columns: displayed"></tr>
    </table>

    <mat-paginator [length]="total()" [pageSize]="pageSize" [pageIndex]="pageIndex()" (page)="onPage($event)" />
  `,
  styles: [`
    .header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .filters { display:flex; gap:16px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
    table { width:100%; }
  `]
})
export class StudentsComponent implements OnInit {
  private readonly svc = inject(StudentHttpService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly items = signal<StudentSummaryDto[]>([]);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = 10;

  search = '';
  includeInactive = false;
  displayed = ['name', 'dob', 'class', 'status', 'actions'];

  ngOnInit(): void { this.load(); }

  load() {
    this.svc.getAll({
      page: this.pageIndex() + 1,
      pageSize: this.pageSize,
      search: this.search || undefined,
      includeInactive: this.includeInactive
    }).subscribe(r => {
      this.items.set(r?.data ?? []);
      this.total.set(r?.totalCount ?? 0);
    });
  }

  reload() { this.pageIndex.set(0); this.load(); }
  onPage(e: PageEvent) { this.pageIndex.set(e.pageIndex); this.load(); }
  create() { this.router.navigate(['/admin/students/create']); }
  view(id: string) { this.router.navigate(['/admin/students', id]); }
  edit(id: string) { this.router.navigate(['/admin/students', id, 'edit']); }

  async deactivate(id: string, name: string) {
    const ok = await this.confirm('Confirm deactivation', `Deactivate student '${name}'?`);
    if (!ok) return;
    const r = await firstValueFrom(this.svc.delete(id));
    if (r?.success) { this.snack.open('Student deactivated', 'OK', { duration: 2500 }); this.load(); }
  }

  async reactivate(id: string) {
    const r = await firstValueFrom(this.svc.reactivate(id));
    if (r?.success) { this.snack.open('Student reactivated', 'OK', { duration: 2500 }); this.load(); }
  }

  private confirm(title: string, message: string): Promise<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title, message } });
    return new Promise(resolve => ref.afterClosed().subscribe(v => resolve(!!v)));
  }
}
