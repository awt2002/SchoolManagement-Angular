import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseResponse, PagedResponse } from '../models/base-response.model';
import {
  CreateGradeDto, GradeAuditLogDto, GradeDto, GradeSummaryDto
} from '../models/grade.model';

@Injectable({ providedIn: 'root' })
export class GradeHttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/grades`;

  getAll(opts: { subjectId?: string; studentId?: string; academicYearId?: string } = {}) {
    let params = new HttpParams();
    if (opts.subjectId) params = params.set('subjectId', opts.subjectId);
    if (opts.studentId) params = params.set('studentId', opts.studentId);
    if (opts.academicYearId) params = params.set('academicYearId', opts.academicYearId);
    return this.http.get<BaseResponse<GradeDto[]>>(this.baseUrl, { params });
  }

  createOrUpdate(dto: CreateGradeDto) {
    return this.http.post<BaseResponse<GradeDto>>(this.baseUrl, dto);
  }

  getSummary(opts: { studentId?: string; classId?: string; academicYearId?: string } = {}) {
    let params = new HttpParams();
    if (opts.studentId) params = params.set('studentId', opts.studentId);
    if (opts.classId) params = params.set('classId', opts.classId);
    if (opts.academicYearId) params = params.set('academicYearId', opts.academicYearId);
    return this.http.get<BaseResponse<GradeSummaryDto>>(`${this.baseUrl}/summary`, { params });
  }

  getAuditLog(opts: { studentId?: string; subjectId?: string; page?: number; pageSize?: number } = {}) {
    let params = new HttpParams()
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 10));
    if (opts.studentId) params = params.set('studentId', opts.studentId);
    if (opts.subjectId) params = params.set('subjectId', opts.subjectId);
    return this.http.get<PagedResponse<GradeAuditLogDto>>(`${this.baseUrl}/audit`, { params });
  }
}
