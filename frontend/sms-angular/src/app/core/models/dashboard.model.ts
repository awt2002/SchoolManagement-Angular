export interface DashboardAnnouncementDto {
  id: string;
  title: string;
  createdAt: string;
  isRead: boolean;
}

export interface DashboardExamDto {
  id: string;
  name: string;
  subjectName: string;
  examDate: string;
}

export interface AdminDashboardDto {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  absencesToday: number;
  unreadAnnouncements: number;
  recentAnnouncements: DashboardAnnouncementDto[];
}

export interface TeacherDashboardDto {
  classStudentCount: number;
  absencesTodayInClass: number;
  upcomingExams: DashboardExamDto[];
  unreadAnnouncements: number;
  recentAnnouncements: DashboardAnnouncementDto[];
}

export interface StudentDashboardDto {
  totalAbsencesThisYear: number;
  gpa: number;
  nextExam?: DashboardExamDto | null;
  unreadAnnouncements: number;
  recentAnnouncements: DashboardAnnouncementDto[];
}
