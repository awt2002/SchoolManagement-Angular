import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { GradeHttpService } from '../../core/http/grade-http.service';
import { GradeAuditLogDto } from '../../core/models/grade.model';

@Component({
  selector: 'app-grade-audit-log',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule],
  template: `
    <h1>Grade audit log</h1>
    <table mat-table [dataSource]="items()" class="mat-elevation-z1">
      <ng-container matColumnDef="student"><th mat-header-cell *matHeaderCellDef>Student</th><td mat-cell *matCellDef="let a">{{ a.studentName }}</td></ng-container>
      <ng-container matColumnDef="subject"><th mat-header-cell *matHeaderCellDef>Subject</th><td mat-cell *matCellDef="let a">{{ a.subjectName }}</td></ng-container>
      <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>Category</th><td mat-cell *matCellDef="let a">{{ a.categoryName }}</td></ng-container>
      <ng-container matColumnDef="old"><th mat-header-cell *matHeaderCellDef>Old score</th><td mat-cell *matCellDef="let a">{{ a.oldScore }}</td></ng-container>
      <ng-container matColumnDef="new"><th mat-header-cell *matHeaderCellDef>New score</th><td mat-cell *matCellDef="let a">{{ a.newScore }}</td></ng-container>
      <ng-container matColumnDef="by"><th mat-header-cell *matHeaderCellDef>Changed by</th><td mat-cell *matCellDef="let a">{{ a.changedBy }}</td></ng-container>
      <ng-container matColumnDef="at"><th mat-header-cell *matHeaderCellDef>Changed at</th><td mat-cell *matCellDef="let a">{{ a.changedAt | date:'short' }}</td></ng-container>
      <tr mat-header-row *matHeaderRowDef="displayed"></tr>
      <tr mat-row *matRowDef="let row; columns: displayed"></tr>
    </table>
    <mat-paginator [length]="total()" [pageSize]="pageSize" [pageIndex]="pageIndex()" (page)="onPage($event)" />
  `,
  styles: [`table{width:100%}`]
})
export class GradeAuditLogComponent implements OnInit {
  private readonly svc = inject(GradeHttpService);
  readonly items = signal<GradeAuditLogDto[]>([]);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = 20;
  displayed = ['student', 'subject', 'category', 'old', 'new', 'by', 'at'];

  ngOnInit(): void { this.load(); }

  load() {
    this.svc.getAuditLog({ page: this.pageIndex() + 1, pageSize: this.pageSize }).subscribe(r => {
      this.items.set(r?.data ?? []);
      this.total.set(r?.totalCount ?? 0);
    });
  }

  onPage(e: PageEvent) { this.pageIndex.set(e.pageIndex); this.load(); }
}
