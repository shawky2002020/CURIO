import { http } from './http.js';
import { LoginPayload, RegisterPayload, AuthResponse } from '../types/auth.types.js';
import { ApiResponse } from '../types/api.types.js';

export const authApi = {
  async register(payload: RegisterPayload): Promise<ApiResponse<AuthResponse>> {
    const response = await http.post<ApiResponse<AuthResponse>>('/auth/register', payload);
    return response.data;
  },

  async login(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
    const response = await http.post<ApiResponse<AuthResponse>>('/auth/login', payload);
    return response.data;
  },

  async googleLogin(credentialToken: string): Promise<ApiResponse<AuthResponse>> {
    const response = await http.post<ApiResponse<AuthResponse>>('/auth/google', { credentialToken });
    return response.data;
  },

  async logout(): Promise<ApiResponse<void>> {
    const response = await http.post<ApiResponse<void>>('/auth/logout');
    return response.data;
  },
};
export default authApi;
