import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseResponse, PagedResponse } from '../models/base-response.model';
import {
  CreateStudentDto,
  StudentDetailDto,
  StudentSummaryDto,
  UpdateStudentDto
} from '../models/student.model';

@Injectable({ providedIn: 'root' })
export class StudentHttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/students`;

  getMyProfile() {
    return this.http.get<BaseResponse<StudentDetailDto>>(`${this.baseUrl}/me`);
  }

  getAll(opts: {
    page?: number; pageSize?: number; search?: string; gradeLevel?: number;
    classId?: string; academicYearId?: string; includeInactive?: boolean; inactiveOnly?: boolean;
  } = {}) {
    let params = new HttpParams()
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 10))
      .set('includeInactive', String(opts.includeInactive ?? false));
    if (opts.inactiveOnly) params = params.set('inactiveOnly', 'true');
    if (opts.search) params = params.set('search', opts.search);
    if (opts.gradeLevel != null) params = params.set('gradeLevel', String(opts.gradeLevel));
    if (opts.classId) params = params.set('classId', opts.classId);
    if (opts.academicYearId) params = params.set('academicYearId', opts.academicYearId);
    return this.http.get<PagedResponse<StudentSummaryDto>>(this.baseUrl, { params });
  }

  getById(id: string) {
    return this.http.get<BaseResponse<StudentDetailDto>>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateStudentDto) {
    return this.http.post<BaseResponse<StudentDetailDto>>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateStudentDto) {
    return this.http.put<BaseResponse<StudentDetailDto>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<BaseResponse<unknown>>(`${this.baseUrl}/${id}`);
  }

  reactivate(id: string) {
    return this.http.put<BaseResponse<unknown>>(`${this.baseUrl}/${id}/reactivate`, {});
  }
}
