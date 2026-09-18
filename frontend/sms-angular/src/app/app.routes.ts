import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'announcements',
        loadComponent: () => import('./features/announcements/announcement-list.component').then(m => m.AnnouncementListComponent)
      },
      {
        path: 'announcements/:id',
        loadComponent: () => import('./features/announcements/announcement-detail.component').then(m => m.AnnouncementDetailComponent)
      },

      // Admin
      {
        path: 'admin/students',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/students.component').then(m => m.StudentsComponent)
      },
      {
        path: 'admin/students/create',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/create-student.component').then(m => m.CreateStudentComponent)
      },
      {
        path: 'admin/students/:id',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/student-detail.component').then(m => m.StudentDetailComponent)
      },
      {
        path: 'admin/students/:id/edit',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/edit-student.component').then(m => m.EditStudentComponent)
      },
      {
        path: 'admin/teachers',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/teachers.component').then(m => m.TeachersComponent)
      },
      {
        path: 'admin/teachers/create',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/create-teacher.component').then(m => m.CreateTeacherComponent)
      },
      {
        path: 'admin/teachers/:id/edit',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/edit-teacher.component').then(m => m.EditTeacherComponent)
      },
      {
        path: 'admin/classes',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/classes.component').then(m => m.ClassesComponent)
      },
      {
        path: 'admin/classes/create',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/create-class.component').then(m => m.CreateClassComponent)
      },
      {
        path: 'admin/classes/:id',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/class-detail.component').then(m => m.ClassDetailComponent)
      },
      {
        path: 'admin/classes/:id/edit',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/edit-class.component').then(m => m.EditClassComponent)
      },
      {
        path: 'admin/classes/:id/subjects',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/subject-management.component').then(m => m.SubjectManagementComponent)
      },
      {
        path: 'admin/academic-years',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/academic-years.component').then(m => m.AcademicYearsComponent)
      },
      {
        path: 'admin/attendance',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/attendance.component').then(m => m.AdminAttendanceComponent)
      },
      {
        path: 'admin/grades/audit',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/grade-audit-log.component').then(m => m.GradeAuditLogComponent)
      },
      {
        path: 'admin/announcements/create',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/admin/create-announcement.component').then(m => m.CreateAnnouncementComponent)
      },

      // Teacher
      {
        path: 'teacher/my-class',
        canActivate: [roleGuard('Teacher')],
        loadComponent: () => import('./features/teacher/my-class.component').then(m => m.MyClassComponent)
      },
      {
        path: 'teacher/attendance',
        canActivate: [roleGuard('Teacher')],
        loadComponent: () => import('./features/teacher/teacher-attendance.component').then(m => m.TeacherAttendanceComponent)
      },
      {
        path: 'teacher/grades',
        canActivate: [roleGuard('Teacher')],
        loadComponent: () => import('./features/teacher/teacher-grades.component').then(m => m.TeacherGradesComponent)
      },
      {
        path: 'teacher/grades/:subjectId',
        canActivate: [roleGuard('Teacher')],
        loadComponent: () => import('./features/teacher/teacher-grade-detail.component').then(m => m.TeacherGradeDetailComponent)
      },
      {
        path: 'teacher/exams',
        canActivate: [roleGuard('Teacher')],
        loadComponent: () => import('./features/teacher/teacher-exams.component').then(m => m.TeacherExamsComponent)
      },
      {
        path: 'teacher/exams/create',
        canActivate: [roleGuard('Teacher')],
        loadComponent: () => import('./features/teacher/create-exam.component').then(m => m.CreateExamComponent)
      },
      {
        path: 'teacher/exams/:id/scores',
        canActivate: [roleGuard('Teacher')],
        loadComponent: () => import('./features/teacher/exam-scores.component').then(m => m.ExamScoresComponent)
      },
      {
        path: 'teacher/announcements/create',
        canActivate: [roleGuard('Teacher')],
        loadComponent: () => import('./features/teacher/create-teacher-announcement.component').then(m => m.CreateTeacherAnnouncementComponent)
      },

      // Student
      {
        path: 'student/attendance',
        canActivate: [roleGuard('Student')],
        loadComponent: () => import('./features/student/student-attendance.component').then(m => m.StudentAttendanceComponent)
      },
      {
        path: 'student/grades',
        canActivate: [roleGuard('Student')],
        loadComponent: () => import('./features/student/student-grades.component').then(m => m.StudentGradesComponent)
      },
      {
        path: 'student/exams',
        canActivate: [roleGuard('Student')],
        loadComponent: () => import('./features/student/student-exams.component').then(m => m.StudentExamsComponent)
      },
      {
        path: 'student/exams/:id',
        canActivate: [roleGuard('Student')],
        loadComponent: () => import('./features/student/student-exam-detail.component').then(m => m.StudentExamDetailComponent)
      }
    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];
