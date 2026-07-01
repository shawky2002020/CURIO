import { IUser } from '../modules/users/user.model.js';
import { User } from '../types/auth.types.js';

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
    storeName: user.storeName,
    storeDescription: user.storeDescription,
    storeAddress: user.storeAddress ? {
      street: user.storeAddress.street,
      city: user.storeAddress.city,
      state: user.storeAddress.state,
      country: user.storeAddress.country,
      postalCode: user.storeAddress.postalCode,
    } : undefined,
    storeLogoUrl: user.storeLogoUrl,
    storePhone: user.storePhone,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
};
