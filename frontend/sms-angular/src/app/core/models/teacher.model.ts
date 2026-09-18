export interface CreateTeacherDto {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  classId?: string | null;
}

export interface UpdateTeacherDto {
  fullName: string;
  email: string;
  phoneNumber: string;
  classId?: string | null;
}

export interface TeacherDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  username: string;
  isActive: boolean;
  assignedClassName?: string | null;
  classId?: string | null;
}
