export interface CreateGradeDto {
  studentId: string;
  gradeCategoryId: string;
  score: number;
}

export interface GradeDto {
  id: string;
  studentId: string;
  studentName: string;
  gradeCategoryId: string;
  subjectName: string;
  categoryName: string;
  score: number;
  weightedContribution: number;
}

export interface SubjectAverageDto {
  subjectId: string;
  subjectName: string;
  weightedAverage: number;
}

export interface GradeSummaryDto {
  subjectAverages: SubjectAverageDto[];
  gpa: number;
}

export interface GradeAuditLogDto {
  id: string;
  studentName: string;
  subjectName: string;
  categoryName: string;
  oldScore: number;
  newScore: number;
  changedBy: string;
  changedAt: string;
}
