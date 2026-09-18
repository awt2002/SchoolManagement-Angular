export interface CreateStudentDto {
  fullName: string;
  dateOfBirth: string;
  address: string;
  classId?: string | null;
  academicYearId?: string | null;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
}

export interface UpdateStudentDto {
  fullName: string;
  dateOfBirth: string;
  address: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
}

export interface StudentSummaryDto {
  id: string;
  fullName: string;
  dateOfBirth: string;
  className: string;
  gradeLevel: number;
  isActive: boolean;
}

export interface EnrollmentDto {
  id: string;
  className: string;
  academicYearName: string;
  enrolledAt: string;
}

export interface StudentDetailDto {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  enrollmentYear: number;
  isActive: boolean;
  currentClassId?: string | null;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  enrollments: EnrollmentDto[];
}
