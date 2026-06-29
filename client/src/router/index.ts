import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { authGuard, roleGuard } from './guards.js';

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
        component: () => import('../modules/catalog/pages/CatalogPage.vue'),
      },
      {
        path: 'products/:id',
        name: 'product-detail',
        component: () => import('../modules/catalog/pages/ProductDetailPage.vue'),
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
        path: 'admin/dashboard',
        name: 'admin-dashboard',
        component: () => import('../modules/admin/pages/AdminDashboardPage.vue'),
        beforeEnter: roleGuard(['admin']),
      },
      {
        path: 'seller/dashboard',
        name: 'seller-dashboard',
        component: () => import('../modules/seller/pages/SellerDashboardPage.vue'),
        beforeEnter: roleGuard(['seller']),
      },
      {
        path: 'admin/products',
        name: 'admin-products',
        component: () => import('../modules/admin/pages/AdminProductsPage.vue'),
        beforeEnter: roleGuard(['admin', 'seller']),
      },
      {
        path: 'admin/categories',
        name: 'admin-categories',
        component: () => import('../modules/admin/pages/AdminCategoriesPage.vue'),
        beforeEnter: roleGuard(['admin']),
      },
      {
        path: 'cart',
        name: 'cart',
        component: () => import('../modules/cart/pages/CartPage.vue'),
      },
      {
        path: 'checkout',
        name: 'checkout',
        component: () => import('../modules/cart/pages/CheckoutPage.vue'),
      },
      {
        path: 'orders/:id',
        name: 'order-success',
        component: () => import('../modules/cart/pages/OrderSuccessPage.vue'),
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

