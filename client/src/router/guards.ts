import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../stores/auth.store.js';
import { useToastStore } from '../stores/toast.store.js';
import type { UserRole } from '../types/auth.types.js';

/**
 * Guest Guard: Redirects authenticated users away from auth pages (login, register, etc.).
 */
export const guestGuard = (
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();
  if (authStore.isAuthenticated) {
    return next({ name: 'home' });
  }
  next();
};

/**
 * Auth Guard: Restricts unauthenticated guests from viewing private routes.
 */
export const authGuard = (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }
  next();
};

/**
 * Role Guard: Restricts access to routes based on user role.
 */
export const roleGuard = (allowedRoles: UserRole[]) => {
  return (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore();
    const toastStore = useToastStore();
    
    if (!authStore.isAuthenticated) {
      return next({ name: 'login', query: { redirect: to.fullPath } });
    }

    const userRole = authStore.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      toastStore.error('Access Denied');
      return next({ name: 'home' });
    }
    
    next();
  };
};
