import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../models/base-response.model';
import {
  CreateGradeCategoryDto, CreateSubjectDto, GradeCategoryDto,
  SubjectDto, UpdateSubjectDto
} from '../models/subject.model';

@Injectable({ providedIn: 'root' })
export class SubjectHttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/subjects`;

  getAll(classId?: string) {
    let params = new HttpParams();
    if (classId) params = params.set('classId', classId);
    return this.http.get<BaseResponse<SubjectDto[]>>(this.baseUrl, { params });
  }

  getById(id: string) {
    return this.http.get<BaseResponse<SubjectDto>>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateSubjectDto) {
    return this.http.post<BaseResponse<SubjectDto>>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateSubjectDto) {
    return this.http.put<BaseResponse<SubjectDto>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<BaseResponse<unknown>>(`${this.baseUrl}/${id}`);
  }

  createCategory(subjectId: string, dto: CreateGradeCategoryDto) {
    return this.http.post<BaseResponse<GradeCategoryDto>>(`${this.baseUrl}/${subjectId}/categories`, dto);
  }

  deleteCategory(subjectId: string, categoryId: string) {
    return this.http.delete<BaseResponse<unknown>>(
      `${this.baseUrl}/${subjectId}/categories/${categoryId}`
    );
  }
}
