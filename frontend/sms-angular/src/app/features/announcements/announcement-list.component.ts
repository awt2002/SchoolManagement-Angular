import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { TokenService } from '../../core/auth/token.service';
import { AnnouncementHttpService } from '../../core/http/announcement-http.service';
import { AnnouncementDto } from '../../core/models/announcement.model';

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatListModule,
    MatChipsModule, MatPaginatorModule, MatDividerModule
  ],
  template: `
    <div class="header-row">
      <h1>Announcements</h1>
      @if (role() === 'Admin') {
        <button mat-flat-button color="primary" (click)="go('/admin/announcements/create')">New announcement</button>
      }
      @if (role() === 'Teacher') {
        <button mat-flat-button color="primary" (click)="go('/teacher/announcements/create')">New announcement</button>
      }
    </div>

    @if (items()) {
      <mat-nav-list>
        @for (a of items(); track a.id) {
          <a mat-list-item (click)="open(a.id)">
            <div class="row">
              <div>
                <div [style.fontWeight]="a.isRead ? 400 : 600">{{ a.title }}</div>
                <div class="sub">By {{ a.authorName }} · {{ a.createdAt | date:'short' }} · {{ a.className || 'School-wide' }}</div>
              </div>
              @if (!a.isRead) {
                <mat-chip color="primary" highlighted>New</mat-chip>
              }
            </div>
          </a>
          <mat-divider />
        }
      </mat-nav-list>
      <mat-paginator [length]="total()" [pageSize]="pageSize" [pageIndex]="pageIndex()" (page)="onPage($event)" />
    }
  `,
  styles: [`
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .sub { font-size: 12px; color: rgba(0,0,0,0.6); margin-top: 4px; }
  `]
})
export class AnnouncementListComponent implements OnInit {
  private readonly svc = inject(AnnouncementHttpService);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  readonly role = this.tokenService.role;
  readonly items = signal<AnnouncementDto[]>([]);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = 10;

  ngOnInit(): void { this.load(); }

  load() {
    this.svc.getAll({ page: this.pageIndex() + 1, pageSize: this.pageSize }).subscribe(r => {
      this.items.set(r?.data ?? []);
      this.total.set(r?.totalCount ?? 0);
    });
  }

  onPage(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.load();
  }

  open(id: string) { this.router.navigate(['/announcements', id]); }
  go(path: string) { this.router.navigate([path]); }
}
