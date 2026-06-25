import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../stores/auth.store.js';
import { UserRole } from '../types/auth.types.js';

/**
 * Guest Guard: Redirects authenticated users away from auth pages (login, register, etc.).
 */
export const guestGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
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
  from: RouteLocationNormalized,
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
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore();
    
    if (!authStore.isAuthenticated) {
      return next({ name: 'login' });
    }

    const userRole = authStore.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to a 403 Forbidden page or Home
      return next({ name: 'forbidden' });
    }
    
    next();
  };
};
