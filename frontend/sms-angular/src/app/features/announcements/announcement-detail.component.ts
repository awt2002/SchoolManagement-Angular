import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TokenService } from '../../core/auth/token.service';
import { AnnouncementHttpService } from '../../core/http/announcement-http.service';
import { AnnouncementDto } from '../../core/models/announcement.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule
  ],
  template: `
    <button mat-button (click)="back()">
      <mat-icon>arrow_back</mat-icon> Back to announcements
    </button>

    @if (announcement(); as a) {
      <mat-card class="mt-2">
        @if (editing()) {
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput [(ngModel)]="editTitle">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Body</mat-label>
              <textarea matInput [(ngModel)]="editBody" rows="6"></textarea>
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions>
            <button mat-flat-button color="primary" (click)="saveEdit()">Save</button>
            <button mat-button (click)="cancelEdit()">Cancel</button>
          </mat-card-actions>
        } @else {
          <mat-card-header>
            <mat-card-title>{{ a.title }}</mat-card-title>
            <mat-card-subtitle>
              By {{ a.authorName }} · {{ a.createdAt | date:'short' }} · {{ a.className || 'School-wide' }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p class="body">{{ a.body }}</p>
          </mat-card-content>
          @if (isAuthor()) {
            <mat-card-actions>
              <button mat-button color="primary" (click)="startEdit()"><mat-icon>edit</mat-icon> Edit</button>
              <button mat-button color="warn" (click)="remove()"><mat-icon>delete</mat-icon> Delete</button>
            </mat-card-actions>
          }
        }
      </mat-card>
    }
  `,
  styles: [`
    .mt-2 { margin-top: 16px; }
    .body { white-space: pre-wrap; }
    .full-width { width: 100%; }
  `]
})
export class AnnouncementDetailComponent implements OnInit {
  private readonly svc = inject(AnnouncementHttpService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly tokenService = inject(TokenService);

  @Input() id!: string;
  readonly announcement = signal<AnnouncementDto | null>(null);
  readonly editing = signal(false);
  readonly isAuthor = signal(false);

  editTitle = '';
  editBody = '';

  ngOnInit(): void {
    this.svc.getById(this.id).subscribe(r => {
      this.announcement.set(r?.data ?? null);
      if (r?.data) {
        this.svc.markAsRead(this.id).subscribe();
        const username = this.tokenService.username();
        this.isAuthor.set(r.data.authorName === username);
      }
    });
  }

  startEdit() {
    const a = this.announcement();
    if (!a) return;
    this.editTitle = a.title;
    this.editBody = a.body;
    this.editing.set(true);
  }

  cancelEdit() { this.editing.set(false); }

  async saveEdit() {
    if (!this.editTitle.trim() || !this.editBody.trim()) {
      this.snack.open('Title and body are required', 'OK', { duration: 3000 });
      return;
    }
    const r = await firstValueFrom(this.svc.update(this.id, { title: this.editTitle, body: this.editBody }));
    if (r?.success) {
      this.announcement.set(r.data ?? null);
      this.editing.set(false);
      this.snack.open('Announcement updated', 'OK', { duration: 2500 });
    } else {
      this.snack.open(r?.message ?? 'Failed to update', 'OK', { duration: 4000 });
    }
  }

  async remove() {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete announcement', message: 'Delete this announcement? This cannot be undone.' }
    });
    ref.afterClosed().subscribe(async ok => {
      if (!ok) return;
      const r = await firstValueFrom(this.svc.delete(this.id));
      if (r?.success) {
        this.snack.open('Announcement deleted', 'OK', { duration: 2500 });
        this.router.navigate(['/announcements']);
      } else {
        this.snack.open(r?.message ?? 'Failed to delete', 'OK', { duration: 4000 });
      }
    });
  }

  back() { this.router.navigate(['/announcements']); }
}
