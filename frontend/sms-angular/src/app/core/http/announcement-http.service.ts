import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseResponse, PagedResponse } from '../models/base-response.model';
import { AnnouncementDto, CreateAnnouncementDto, UpdateAnnouncementDto, UnreadCountDto } from '../models/announcement.model';

@Injectable({ providedIn: 'root' })
export class AnnouncementHttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/announcements`;

  getAll(opts: { page?: number; pageSize?: number } = {}) {
    const params = new HttpParams()
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 10));
    return this.http.get<PagedResponse<AnnouncementDto>>(this.baseUrl, { params });
  }

  create(dto: CreateAnnouncementDto) {
    return this.http.post<BaseResponse<AnnouncementDto>>(this.baseUrl, dto);
  }

  getById(id: string) {
    return this.http.get<BaseResponse<AnnouncementDto>>(`${this.baseUrl}/${id}`);
  }

  markAsRead(id: string) {
    return this.http.post<BaseResponse<unknown>>(`${this.baseUrl}/${id}/read`, {});
  }

  update(id: string, dto: UpdateAnnouncementDto) {
    return this.http.put<BaseResponse<AnnouncementDto>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<BaseResponse<unknown>>(`${this.baseUrl}/${id}`);
  }

  getUnreadCount() {
    return this.http.get<BaseResponse<UnreadCountDto>>(`${this.baseUrl}/unread-count`);
  }
}
