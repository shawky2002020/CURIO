import { RouteRecordRaw } from 'vue-router';
import { guestGuard } from '../../router/guards.js';

export const authRoutes: RouteRecordRaw[] = [
  {
    path: 'login',
    name: 'login',
    component: () => import('./pages/LoginPage.vue'),
    beforeEnter: guestGuard,
  },
  {
    path: 'register',
    name: 'register',
    component: () => import('./pages/RegisterPage.vue'),
    beforeEnter: guestGuard,
  },
  {
    path: 'verify-email',
    name: 'verify-email',
    component: () => import('./pages/VerifyEmailPage.vue'),
  },
  {
    path: 'forgot-password',
    name: 'forgot-password',
    component: () => import('./pages/ForgotPasswordPage.vue'),
    beforeEnter: guestGuard,
  },
  {
    path: 'reset-password',
    name: 'reset-password',
    component: () => import('./pages/ResetPasswordPage.vue'),
    beforeEnter: guestGuard,
  },
];

export default authRoutes;
