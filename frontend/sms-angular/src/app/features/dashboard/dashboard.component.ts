import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { TokenService } from '../../core/auth/token.service';
import { DashboardHttpService } from '../../core/http/dashboard-http.service';
import {
  AdminDashboardDto, StudentDashboardDto, TeacherDashboardDto
} from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, DatePipe,
    MatCardModule, MatIconModule, MatButtonModule, MatTableModule, MatListModule, MatDividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private readonly tokenService = inject(TokenService);
  private readonly svc = inject(DashboardHttpService);
  private readonly router = inject(Router);

  readonly role = this.tokenService.role;
  readonly admin = signal<AdminDashboardDto | null>(null);
  readonly teacher = signal<TeacherDashboardDto | null>(null);
  readonly student = signal<StudentDashboardDto | null>(null);

  ngOnInit(): void {
    const r = this.role();
    if (r === 'Admin') {
      this.svc.getAdmin().subscribe(res => this.admin.set(res?.data ?? null));
    } else if (r === 'Teacher') {
      this.svc.getTeacher().subscribe(res => this.teacher.set(res?.data ?? null));
    } else if (r === 'Student') {
      this.svc.getStudent().subscribe(res => this.student.set(res?.data ?? null));
    }
  }

  go(path: string) { this.router.navigate([path]); }
}
