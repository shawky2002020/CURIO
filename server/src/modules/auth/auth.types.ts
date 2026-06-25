import { UserRole } from '../../types/auth.types.js';

export interface RegisterPayload {
  fullName: string;
  email?: string;
  phone?: string;
  password?: string;
  role: UserRole;
}

export interface LoginPayload {
  email?: string;
  phone?: string;
  password?: string;
}

export interface GoogleOAuthPayload {
  credentialToken: string;
}

export interface RequestOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  passwordHash: string;
}
