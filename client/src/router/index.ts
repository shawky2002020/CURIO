import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { authGuard, guestGuard, roleGuard } from './guards.js';

// Layouts
import MainLayout from '../layouts/MainLayout.vue';
import AuthLayout from '../layouts/AuthLayout.vue';

// Modules routes placeholders
import authRoutes from '../modules/auth/auth.routes.js';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../modules/auth/pages/LoginPage.vue'), // Temporary fallback or Home page
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('../modules/profile/pages/ProfilePage.vue'),
        beforeEnter: authGuard,
      },
      {
        path: 'profile/edit',
        name: 'profile-edit',
        component: () => import('../modules/profile/pages/EditProfilePage.vue'),
        beforeEnter: authGuard,
      },
      {
        path: 'wishlist',
        name: 'wishlist',
        component: () => import('../modules/wishlist/pages/WishlistPage.vue'),
        beforeEnter: authGuard,
      },
      {
        path: 'forbidden',
        name: 'forbidden',
        component: { template: '<div>Access Forbidden - 403</div>' } as any,
      },
    ],
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      ...authRoutes,
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
