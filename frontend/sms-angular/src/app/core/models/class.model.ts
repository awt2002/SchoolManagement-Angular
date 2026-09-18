export interface CreateClassDto {
  name: string;
  gradeLevel: number;
  teacherId?: string | null;
  academicYearId: string;
}

export interface UpdateClassDto {
  name: string;
  gradeLevel: number;
  teacherId?: string | null;
  academicYearId: string;
}

export interface ClassDto {
  id: string;
  name: string;
  gradeLevel: number;
  teacherName?: string | null;
  teacherId?: string | null;
  studentCount: number;
  academicYearId: string;
  academicYearName: string;
}

export interface ClassStudentDto {
  id: string;
  fullName: string;
}

export interface ClassSubjectDto {
  id: string;
  name: string;
}

export interface ClassDetailDto extends ClassDto {
  students: ClassStudentDto[];
  subjects: ClassSubjectDto[];
}

export interface EnrollStudentDto {
  studentId: string;
}
