import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../models/base-response.model';
import {
  AdminDashboardDto, StudentDashboardDto, TeacherDashboardDto
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardHttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/dashboard`;

  getAdmin() {
    return this.http.get<BaseResponse<AdminDashboardDto>>(this.baseUrl);
  }

  getTeacher() {
    return this.http.get<BaseResponse<TeacherDashboardDto>>(this.baseUrl);
  }

  getStudent() {
    return this.http.get<BaseResponse<StudentDashboardDto>>(this.baseUrl);
  }
}
