export type UserRole = 'customer' | 'seller' | 'admin';

export const ROLES = {
  CUSTOMER: 'customer' as UserRole,
  SELLER: 'seller' as UserRole,
  ADMIN: 'admin' as UserRole,
} as const;
