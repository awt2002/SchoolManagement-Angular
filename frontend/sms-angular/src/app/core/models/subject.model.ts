export interface CreateGradeCategoryDto {
  name: string;
  weight: number;
}

export interface GradeCategoryDto {
  id: string;
  name: string;
  weight: number;
  subjectId: string;
}

export interface CreateSubjectDto {
  name: string;
  classId: string;
}

export interface UpdateSubjectDto {
  name: string;
}

export interface SubjectDto {
  id: string;
  name: string;
  classId: string;
  gradeCategories: GradeCategoryDto[];
}
