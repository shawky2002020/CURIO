export type UserRole = 'customer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'blocked' | 'deleted';
export type AuthProvider = 'local' | 'google';

export interface User {
  id: string;
  fullName: string;
  email?: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  avatarUrl?: string;
  role: UserRole;
  provider: AuthProvider;
  status: UserStatus;
  lastLoginAt?: string;
  storeName?: string;
  storeDescription?: string;
  storeAddress?: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };
  storeLogoUrl?: string;
  storePhone?: string;
  createdAt: string;
  updatedAt: string;
}


export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email?: string;
  phone?: string;
  password?: string;
}

export interface RegisterPayload {
  fullName: string;
  email?: string;
  phone?: string;
  password?: string;
  role: UserRole;
}
