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
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    beforeEnter: roleGuard(['admin', 'seller']),
    children: [
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('../modules/admin/pages/AdminDashboardPage.vue'),
        beforeEnter: roleGuard(['admin']),
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: () => import('../modules/admin/pages/AdminCategoriesPage.vue'),
        beforeEnter: roleGuard(['admin']),
      },
      {
        path: 'products',
        name: 'admin-products',
        component: () => import('../modules/admin/pages/AdminProductsPage.vue'),
        beforeEnter: roleGuard(['admin', 'seller']),
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../modules/admin/pages/AdminUsersPage.vue'),
        beforeEnter: roleGuard(['admin']),
      },
      {
        path: 'sellers',
        name: 'admin-sellers',
        component: () => import('../modules/admin/pages/AdminSellersPage.vue'),
        beforeEnter: roleGuard(['admin']),
      },
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('../modules/admin/pages/AdminOrdersPage.vue'),
        beforeEnter: roleGuard(['admin']),
      },
      {
        path: 'reviews',
        name: 'admin-reviews',
        component: () => import('../modules/admin/pages/AdminReviewsPage.vue'),
        beforeEnter: roleGuard(['admin']),
      },
      {
        path: 'coupons',
        name: 'admin-coupons',
        component: () => import('../modules/admin/pages/AdminCouponsPage.vue'),
        beforeEnter: roleGuard(['admin']),
      },
      {
        path: 'banners',
        name: 'admin-banners',
        component: () => import('../modules/admin/pages/AdminBannersPage.vue'),
        beforeEnter: roleGuard(['admin']),
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('../modules/admin/pages/AdminSettingsPage.vue'),
        beforeEnter: roleGuard(['admin']),
      },
    ],
  },
  {
    path: '/seller',
    component: () => import('../layouts/SellerLayout.vue'),
    beforeEnter: roleGuard(['seller']),
    children: [
      {
        path: 'dashboard',
        name: 'seller-dashboard',
        component: () => import('../modules/seller/pages/SellerDashboardPage.vue'),
      },
      {
        path: 'inventory',
        name: 'seller-inventory',
        component: () => import('../modules/seller/pages/SellerDashboardPage.vue'),
      },
      {
        path: 'orders',
        name: 'seller-orders',
        component: () => import('../modules/seller/pages/SellerDashboardPage.vue'),
      },
      {
        path: 'reviews',
        name: 'seller-reviews',
        component: () => import('../modules/seller/pages/SellerDashboardPage.vue'),
      },
      {
        path: 'profile',
        name: 'seller-profile',
        component: () => import('../modules/seller/pages/SellerDashboardPage.vue'),
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

