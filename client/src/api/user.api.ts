import { http } from './http.js';
import { User } from '../types/auth.types.js';
import { UpdateProfilePayload } from '../types/user.types.js';
import { ApiResponse } from '../types/api.types.js';

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
};
export default userApi;
