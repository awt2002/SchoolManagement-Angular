import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AcademicYearHttpService } from '../../core/http/academic-year-http.service';
import { AcademicYearDto } from '../../core/models/academic-year.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-academic-years',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatTableModule, MatChipsModule
  ],
  template: `
    <h1>Academic years</h1>
    <mat-card>
      <mat-card-content class="form-row">
        <mat-form-field appearance="outline"><mat-label>Name (e.g. 2026-2027)</mat-label><input matInput [(ngModel)]="name"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Start date</mat-label><input matInput [matDatepicker]="s" [(ngModel)]="startDate"><mat-datepicker-toggle matIconSuffix [for]="s" /><mat-datepicker #s /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>End date</mat-label><input matInput [matDatepicker]="e" [(ngModel)]="endDate"><mat-datepicker-toggle matIconSuffix [for]="e" /><mat-datepicker #e /></mat-form-field>
        <button mat-flat-button color="primary" (click)="create()">Create</button>
      </mat-card-content>
    </mat-card>

    <table mat-table [dataSource]="items()" class="mat-elevation-z1 mt-2">
      <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let y">{{ y.name }}</td></ng-container>
      <ng-container matColumnDef="start"><th mat-header-cell *matHeaderCellDef>Start</th><td mat-cell *matCellDef="let y">{{ y.startDate }}</td></ng-container>
      <ng-container matColumnDef="end"><th mat-header-cell *matHeaderCellDef>End</th><td mat-cell *matCellDef="let y">{{ y.endDate }}</td></ng-container>
      <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let y">
        <mat-chip [color]="y.isActive ? 'primary' : ''" [highlighted]="y.isActive">{{ y.isActive ? 'Active' : 'Inactive' }}</mat-chip>
      </td></ng-container>
      <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let y">
        @if (!y.isActive) {
          <button mat-button color="primary" (click)="activate(y.id)">Activate</button>
          <button mat-icon-button color="warn" (click)="remove(y.id, y.name)"><mat-icon>delete</mat-icon></button>
        }
      </td></ng-container>
      <tr mat-header-row *matHeaderRowDef="['name','start','end','status','actions']"></tr>
      <tr mat-row *matRowDef="let row; columns: ['name','start','end','status','actions']"></tr>
    </table>
  `,
  styles: [`.form-row{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.mt-2{margin-top:16px}table{width:100%}`]
})
export class AcademicYearsComponent implements OnInit {
  private readonly svc = inject(AcademicYearHttpService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly items = signal<AcademicYearDto[]>([]);
  name = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  ngOnInit(): void { this.load(); }

  load() { this.svc.getAll().subscribe(r => this.items.set(r?.data ?? [])); }

  async create() {
    if (!this.name || !this.startDate || !this.endDate) return;
    const r = await firstValueFrom(this.svc.create({
      name: this.name,
      startDate: this.startDate.toISOString().substring(0, 10),
      endDate: this.endDate.toISOString().substring(0, 10)
    }));
    if (r?.success) {
      this.snack.open('Academic year created', 'OK', { duration: 2500 });
      this.name = ''; this.startDate = null; this.endDate = null;
      this.load();
    }
  }

  async activate(id: string) {
    await firstValueFrom(this.svc.activate(id));
    this.snack.open('Academic year activated', 'OK', { duration: 2500 });
    this.load();
  }

  async remove(id: string, name: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete academic year', message: `Delete '${name}'? This cannot be undone.` }
    });
    ref.afterClosed().subscribe(async ok => {
      if (!ok) return;
      const r = await firstValueFrom(this.svc.delete(id));
      if (r?.success) { this.snack.open('Academic year deleted', 'OK', { duration: 2500 }); this.load(); }
      else { this.snack.open(r?.message ?? 'Failed to delete', 'OK', { duration: 4000 }); }
    });
  }
}
