export interface CreateAttendanceDto {
  studentId: string;
  classId: string;
  absenceDate: string;
}

export interface AttendanceRecordDto {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  absenceDate: string;
  recordedByName: string;
  recordedAt: string;
}

export interface AttendanceSummaryDto {
  totalAbsences: number;
  absenceDates: string[];
}
