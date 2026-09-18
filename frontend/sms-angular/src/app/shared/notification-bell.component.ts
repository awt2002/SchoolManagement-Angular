import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, timer, switchMap } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AnnouncementHttpService } from '../core/http/announcement-http.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatBadgeModule, MatTooltipModule],
  template: `
    <button mat-icon-button matTooltip="Notifications" (click)="go()">
      <mat-icon [matBadge]="unread() > 0 ? unread() : null" matBadgeColor="warn">notifications</mat-icon>
    </button>
  `
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly svc = inject(AnnouncementHttpService);
  private readonly router = inject(Router);
  readonly unread = signal(0);
  private pollSub?: Subscription;

  ngOnInit(): void {
    this.pollSub = timer(0, 60_000).pipe(
      switchMap(() => this.svc.getUnreadCount())
    ).subscribe({
      next: r => this.unread.set(r?.data?.count ?? 0),
      error: () => this.unread.set(0)
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  go() { this.router.navigate(['/announcements']); }
}
