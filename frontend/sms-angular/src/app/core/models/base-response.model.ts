export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data?: T | null;
  errors?: string[];
  statusCode: number;
}

export interface PagedResponse<T> extends BaseResponse<T[]> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
