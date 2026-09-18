import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../models/base-response.model';
import {
  AcademicYearDto, CreateAcademicYearDto, UpdateAcademicYearDto
} from '../models/academic-year.model';

@Injectable({ providedIn: 'root' })
export class AcademicYearHttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/academic-years`;

  getAll() {
    return this.http.get<BaseResponse<AcademicYearDto[]>>(this.baseUrl);
  }

  create(dto: CreateAcademicYearDto) {
    return this.http.post<BaseResponse<AcademicYearDto>>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateAcademicYearDto) {
    return this.http.put<BaseResponse<AcademicYearDto>>(`${this.baseUrl}/${id}`, dto);
  }

  activate(id: string) {
    return this.http.put<BaseResponse<AcademicYearDto>>(`${this.baseUrl}/${id}/activate`, {});
  }

  delete(id: string) {
    return this.http.delete<BaseResponse<unknown>>(`${this.baseUrl}/${id}`);
  }
}
