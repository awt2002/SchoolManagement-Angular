import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../models/base-response.model';
import {
  AttendanceRecordDto, AttendanceSummaryDto, CreateAttendanceDto
} from '../models/attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceHttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/attendance`;

  getAll(opts: { classId?: string; studentId?: string; from?: string; to?: string } = {}) {
    let params = new HttpParams();
    if (opts.classId) params = params.set('classId', opts.classId);
    if (opts.studentId) params = params.set('studentId', opts.studentId);
    if (opts.from) params = params.set('from', opts.from);
    if (opts.to) params = params.set('to', opts.to);
    return this.http.get<BaseResponse<AttendanceRecordDto[]>>(this.baseUrl, { params });
  }

  create(dto: CreateAttendanceDto) {
    return this.http.post<BaseResponse<AttendanceRecordDto>>(this.baseUrl, dto);
  }

  delete(id: string) {
    return this.http.delete<BaseResponse<unknown>>(`${this.baseUrl}/${id}`);
  }

  getStudentSummary(studentId: string, academicYearId?: string) {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    return this.http.get<BaseResponse<AttendanceSummaryDto>>(
      `${this.baseUrl}/student/${studentId}/summary`, { params }
    );
  }
}
