import { AnnouncementScope } from './user-role.model';

export interface CreateAnnouncementDto {
  title: string;
  body: string;
  scope: AnnouncementScope;
  classId?: string | null;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  scope: string;
  authorName: string;
  classId?: string | null;
  className?: string | null;
  createdAt: string;
  isRead: boolean;
}

export interface UpdateAnnouncementDto {
  title: string;
  body: string;
}

export interface UnreadCountDto {
  count: number;
}
