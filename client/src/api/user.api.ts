import { http } from './http.js';
import type { User } from '../types/auth.types.js';
import type { UpdateProfilePayload } from '../types/user.types.js';
import type { ApiResponse } from '../types/api.types.js';

export const userApi = {
  async getMe(): Promise<ApiResponse<User>> {
    const response = await http.get<ApiResponse<User>>('/users/me');
    return response.data;
  },

  async updateMe(payload: UpdateProfilePayload): Promise<ApiResponse<User>> {
    const response = await http.patch<ApiResponse<User>>('/users/me', payload);
    return response.data;
  },

  async deleteMe(): Promise<ApiResponse<void>> {
    const response = await http.delete<ApiResponse<void>>('/users/me');
    return response.data;
  },

  async uploadLogo(file: File): Promise<ApiResponse<{ logoUrl: string }>> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await http.post<ApiResponse<{ logoUrl: string }>>('/seller/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
export default userApi;

