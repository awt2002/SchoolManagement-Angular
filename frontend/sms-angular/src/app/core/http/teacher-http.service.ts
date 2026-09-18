import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseResponse, PagedResponse } from '../models/base-response.model';
import { CreateTeacherDto, TeacherDto, UpdateTeacherDto } from '../models/teacher.model';

@Injectable({ providedIn: 'root' })
export class TeacherHttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/teachers`;

  getAll(opts: { page?: number; pageSize?: number; search?: string; includeInactive?: boolean; inactiveOnly?: boolean; } = {}) {
    let params = new HttpParams()
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 10))
      .set('includeInactive', String(opts.includeInactive ?? false));
    if (opts.inactiveOnly) params = params.set('inactiveOnly', 'true');
    if (opts.search) params = params.set('search', opts.search);
    return this.http.get<PagedResponse<TeacherDto>>(this.baseUrl, { params });
  }

  getMe() {
    return this.http.get<BaseResponse<TeacherDto>>(`${this.baseUrl}/me`);
  }

  getById(id: string) {
    return this.http.get<BaseResponse<TeacherDto>>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateTeacherDto) {
    return this.http.post<BaseResponse<TeacherDto>>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateTeacherDto) {
    return this.http.put<BaseResponse<TeacherDto>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<BaseResponse<unknown>>(`${this.baseUrl}/${id}`);
  }

  reactivate(id: string) {
    return this.http.put<BaseResponse<unknown>>(`${this.baseUrl}/${id}/reactivate`, {});
  }
}
