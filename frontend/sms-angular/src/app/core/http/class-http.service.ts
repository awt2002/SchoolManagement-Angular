import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../models/base-response.model';
import {
  ClassDetailDto, ClassDto, CreateClassDto, EnrollStudentDto, UpdateClassDto
} from '../models/class.model';
import { EnrollmentDto } from '../models/student.model';

@Injectable({ providedIn: 'root' })
export class ClassHttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/classes`;

  getAll(opts: { academicYearId?: string; teacherId?: string } = {}) {
    let params = new HttpParams();
    if (opts.academicYearId) params = params.set('academicYearId', opts.academicYearId);
    if (opts.teacherId) params = params.set('teacherId', opts.teacherId);
    return this.http.get<BaseResponse<ClassDto[]>>(this.baseUrl, { params });
  }

  create(dto: CreateClassDto) {
    return this.http.post<BaseResponse<ClassDto>>(this.baseUrl, dto);
  }

  getById(id: string) {
    return this.http.get<BaseResponse<ClassDetailDto>>(`${this.baseUrl}/${id}`);
  }

  update(id: string, dto: UpdateClassDto) {
    return this.http.put<BaseResponse<ClassDto>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<BaseResponse<unknown>>(`${this.baseUrl}/${id}`);
  }

  enrollStudent(classId: string, dto: EnrollStudentDto) {
    return this.http.post<BaseResponse<EnrollmentDto>>(`${this.baseUrl}/${classId}/enroll`, dto);
  }

  removeStudent(classId: string, studentId: string) {
    return this.http.delete<BaseResponse<unknown>>(`${this.baseUrl}/${classId}/enroll/${studentId}`);
  }
}
