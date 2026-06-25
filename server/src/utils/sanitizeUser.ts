import { IUser } from '../modules/users/user.model';
import { User } from '../types/auth.types';

export const sanitizeUser = (user: IUser): User => {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    emailVerified: user.emailVerified,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    avatarUrl: user.avatarUrl,
    role: user.role,
    provider: user.provider,
    status: user.status,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
};
