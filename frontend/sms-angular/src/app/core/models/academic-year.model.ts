export interface CreateAcademicYearDto {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateAcademicYearDto {
  name: string;
  startDate: string;
  endDate: string;
}

export interface AcademicYearDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
