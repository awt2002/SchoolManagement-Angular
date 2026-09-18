import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TokenService } from '../core/auth/token.service';
import { AuthService } from '../core/auth/auth.service';
import { UserRole } from '../core/models/user-role.model';
import { NotificationBellComponent } from '../shared/notification-bell.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: UserRole[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive, RouterOutlet,
    MatToolbarModule, MatIconModule, MatButtonModule, MatSidenavModule,
    MatListModule, MatDialogModule, MatBadgeModule, MatTooltipModule,
    NotificationBellComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly drawerOpen = signal(true);
  readonly role = this.tokenService.role;
  readonly username = this.tokenService.username;

  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['Admin', 'Teacher', 'Student'] },

    { path: '/admin/students', label: 'Students', icon: 'people', roles: ['Admin'] },
    { path: '/admin/teachers', label: 'Teachers', icon: 'school', roles: ['Admin'] },
    { path: '/admin/classes', label: 'Classes', icon: 'class', roles: ['Admin'] },
    { path: '/admin/academic-years', label: 'Academic Years', icon: 'calendar_month', roles: ['Admin'] },
    { path: '/admin/attendance', label: 'Attendance', icon: 'fact_check', roles: ['Admin'] },
    { path: '/admin/grades/audit', label: 'Grade Audit Log', icon: 'history', roles: ['Admin'] },

    { path: '/profile', label: 'My Profile', icon: 'person', roles: ['Teacher', 'Student'] },
    { path: '/teacher/my-class', label: 'My Class', icon: 'class', roles: ['Teacher'] },
    { path: '/teacher/attendance', label: 'Attendance', icon: 'fact_check', roles: ['Teacher'] },
    { path: '/teacher/grades', label: 'Grades', icon: 'grade', roles: ['Teacher'] },
    { path: '/teacher/exams', label: 'Exams', icon: 'quiz', roles: ['Teacher'] },

    { path: '/student/attendance', label: 'Attendance', icon: 'fact_check', roles: ['Student'] },
    { path: '/student/grades', label: 'Grades', icon: 'grade', roles: ['Student'] },
    { path: '/student/exams', label: 'Exams', icon: 'quiz', roles: ['Student'] },

    { path: '/announcements', label: 'Announcements', icon: 'campaign', roles: ['Admin', 'Teacher', 'Student'] }
  ];

  visibleItems() {
    const r = this.role();
    return r ? this.navItems.filter(i => i.roles.includes(r)) : [];
  }

  toggleDrawer() {
    this.drawerOpen.update(v => !v);
  }

  async logout() {
    const r = this.role();
    if (r === 'Admin' || r === 'Teacher') {
      const confirmed = await this.confirm('Confirm Logout', 'Are you sure you want to log out?');
      if (!confirmed) return;
    }
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  private confirm(title: string, message: string): Promise<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title, message }
    });
    return new Promise(resolve => {
      ref.afterClosed().subscribe(v => resolve(!!v));
    });
  }
}
