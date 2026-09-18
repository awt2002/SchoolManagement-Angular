import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../models/base-response.model';
import {
  BulkExamResultDto, CreateExamDto, ExamDto, ExamResultDetailDto, ExamResultDto, UpdateExamDto
} from '../models/exam.model';

@Injectable({ providedIn: 'root' })
export class ExamHttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/exams`;

  getAll(opts: { subjectId?: string; classId?: string; from?: string; to?: string } = {}) {
    let params = new HttpParams();
    if (opts.subjectId) params = params.set('subjectId', opts.subjectId);
    if (opts.classId) params = params.set('classId', opts.classId);
    if (opts.from) params = params.set('from', opts.from);
    if (opts.to) params = params.set('to', opts.to);
    return this.http.get<BaseResponse<ExamDto[]>>(this.baseUrl, { params });
  }

  create(dto: CreateExamDto) {
    return this.http.post<BaseResponse<ExamDto>>(this.baseUrl, dto);
  }

  getById(id: string) {
    return this.http.get<BaseResponse<ExamDto>>(`${this.baseUrl}/${id}`);
  }

  update(id: string, dto: UpdateExamDto) {
    return this.http.put<BaseResponse<ExamDto>>(`${this.baseUrl}/${id}`, dto);
  }

  getResults(examId: string) {
    return this.http.get<BaseResponse<ExamResultDto[]>>(`${this.baseUrl}/${examId}/results`);
  }

  createResults(examId: string, dto: BulkExamResultDto) {
    return this.http.post<BaseResponse<ExamResultDto[]>>(`${this.baseUrl}/${examId}/results`, dto);
  }

  getStudentResult(examId: string, studentId: string) {
    return this.http.get<BaseResponse<ExamResultDetailDto>>(
      `${this.baseUrl}/${examId}/results/${studentId}`
    );
  }

  delete(id: string) {
    return this.http.delete<BaseResponse<unknown>>(`${this.baseUrl}/${id}`);
  }
}
