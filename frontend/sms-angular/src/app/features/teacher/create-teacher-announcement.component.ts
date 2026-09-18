import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AnnouncementHttpService } from '../../core/http/announcement-http.service';
import { TeacherHttpService } from '../../core/http/teacher-http.service';
import { AnnouncementScope } from '../../core/models/user-role.model';

@Component({
  selector: 'app-create-teacher-announcement',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h1>Create class announcement</h1>
    <mat-card>
      <mat-card-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput [(ngModel)]="title">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Body</mat-label>
          <textarea matInput [(ngModel)]="body" rows="6"></textarea>
        </mat-form-field>
      </mat-card-content>
      <mat-card-actions>
        <button mat-flat-button color="primary" (click)="post()">Post announcement</button>
        <button mat-button (click)="cancel()">Cancel</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`.full-width{width:100%}`]
})
export class CreateTeacherAnnouncementComponent implements OnInit {
  private readonly svc = inject(AnnouncementHttpService);
  private readonly teacherSvc = inject(TeacherHttpService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  title = '';
  body = '';
  classId: string | null = null;

  ngOnInit(): void {
    this.teacherSvc.getMe().subscribe(r => this.classId = r?.data?.classId ?? null);
  }

  async post() {
    if (!this.title || !this.body) {
      this.snack.open('Title and body are required', 'OK', { duration: 3000 });
      return;
    }
    if (!this.classId) {
      this.snack.open('You are not assigned to a class', 'OK', { duration: 3000 });
      return;
    }
    const r = await firstValueFrom(this.svc.create({
      title: this.title,
      body: this.body,
      scope: AnnouncementScope.ClassOnly,
      classId: this.classId
    }));
    if (r?.success) { this.snack.open('Announcement posted', 'OK', { duration: 2500 }); this.router.navigate(['/announcements']); }
    else { this.snack.open(r?.message ?? 'Failed', 'OK', { duration: 4000 }); }
  }

  cancel() { this.router.navigate(['/announcements']); }
}
