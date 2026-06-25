export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}
