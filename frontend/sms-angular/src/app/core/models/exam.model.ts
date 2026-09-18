export interface CreateExamDto {
  name: string;
  subjectId: string;
  examDate: string;
  maxScore: number;
  passingThreshold: number;
}

export interface UpdateExamDto {
  name: string;
  examDate: string;
  maxScore: number;
  passingThreshold: number;
}

export interface ExamDto {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  examDate: string;
  maxScore: number;
  passingThreshold: number;
}

export interface ExamResultDto {
  id: string;
  studentId: string;
  studentName: string;
  score: number;
  percentage: number;
  passed: boolean;
}

export interface ExamResultDetailDto {
  score: number;
  percentage: number;
  passed: boolean;
  average: number;
  highest: number;
  lowest: number;
}

export interface ExamScoreEntryDto {
  studentId: string;
  score: number;
}

export interface BulkExamResultDto {
  results: ExamScoreEntryDto[];
}
