<script setup lang="ts">

import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { 
  LayoutDashboard, Users, Briefcase, Tag, Package, 
  ShoppingBag, Star, Percent, Image, Settings, 
  Archive, User, X 
} from '@lucide/vue';

interface Props {
  role: 'admin' | 'seller';
  isOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
});

const emit = defineEmits<{
  (e: 'close-sidebar'): void;
}>();

const route = useRoute();

// Mapping configurations
const adminMenu = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Sellers', path: '/admin/sellers', icon: Briefcase },
  { name: 'Categories', path: '/admin/categories', icon: Tag },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Reviews', path: '/admin/reviews', icon: Star },
  { name: 'Coupons', path: '/admin/coupons', icon: Percent },
  { name: 'Banners', path: '/admin/banners', icon: Image },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

const sellerMenu = [
  { name: 'Dashboard', path: '/seller/dashboard', icon: LayoutDashboard },
  { name: 'Products', path: '/seller/products', icon: Package }, 
  { name: 'Inventory', path: '/seller/inventory', icon: Archive },
  { name: 'Orders', path: '/seller/orders', icon: ShoppingBag },
  { name: 'Reviews', path: '/seller/reviews', icon: Star },
  { name: 'Profile', path: '/seller/profile', icon: User },
];

const menuItems = computed(() => {
  return props.role === 'admin' ? adminMenu : sellerMenu;
});

const isRouteActive = (path: string) => {
  return route.path === path;
};
</script>

<template>
  <div class="sidebar-wrapper" :class="{ 'mobile-open': isOpen }">
    <!-- Backdrop overlay click close on mobile -->
    <div class="mobile-backdrop" @click="emit('close-sidebar')"></div>

    <aside class="sidebar-aside-bar">
      <div class="sidebar-header">
        <div class="branding-group">
          <span class="logo-text">CURIO</span>
          <span class="logo-badge">{{ role.toUpperCase() }}</span>
        </div>
        <button class="close-drawer-btn" @click="emit('close-sidebar')">
          <X class="icon-close" />
        </button>
      </div>

      <nav class="sidebar-nav-menu">
        <ul class="nav-list">
          <li v-for="item in menuItems" :key="item.name">
            <router-link 
              :to="item.path"
              class="nav-link-item"
              :class="{ 'nav-link-item--active': isRouteActive(item.path) }"
              @click="emit('close-sidebar')"
            >
              <component :is="item.icon" class="nav-icon" />
              <span>{{ item.name }}</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>
  </div>
</template>

<style scoped>
.sidebar-wrapper {
  display: flex;
  height: 100vh;
  z-index: 1000;
  box-sizing: border-box;
}

.sidebar-aside-bar {
  width: 260px;
  background-color: #0f1420; /* Dark premium navy */
  color: #a3aab8;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid #1a2336;
  box-sizing: border-box;
  z-index: 1001;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-header {
  height: 70px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid #1a2336;
  box-sizing: border-box;
}

.branding-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-family: var(--font-heading, inherit);
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.03em;
}

.logo-badge {
  font-family: var(--font-display, inherit);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-accent, #6366f1);
  background-color: rgba(99, 102, 241, 0.15);
  padding: 2px 6px;
  border-radius: var(--radius-sm, 4px);
  letter-spacing: 0.05em;
}

.close-drawer-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #a3aab8;
  display: none;
  padding: 8px;
  border-radius: var(--radius-md);
}

.close-drawer-btn:hover {
  background-color: #1a2336;
  color: #ffffff;
}

.icon-close {
  width: 20px;
  height: 20px;
}

.sidebar-nav-menu {
  flex: 1;
  padding: 20px 14px;
  overflow-y: auto;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #a3aab8;
  text-decoration: none;
  font-family: var(--font-sans, inherit);
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: var(--radius-md, 8px);
  transition: all 0.2s;
  box-sizing: border-box;
}

.nav-link-item:hover {
  background-color: rgba(255, 255, 255, 0.03);
  color: #ffffff;
}

.nav-link-item--active {
  background-color: var(--color-primary, #6366f1) !important;
  color: #ffffff !important;
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.mobile-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 20, 32, 0.5);
  backdrop-filter: blur(4px);
  opacity: 0;
  pointer-events: none;
  z-index: 1000;
  transition: opacity 0.2s ease;
}

@media (max-width: 1023px) {
  .sidebar-aside-bar {
    position: fixed;
    top: 0;
    left: 0;
    transform: translateX(-100%);
    box-shadow: none;
  }

  .close-drawer-btn {
    display: block;
  }

  .sidebar-wrapper.mobile-open .sidebar-aside-bar {
    transform: translateX(0);
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.3);
  }

  .sidebar-wrapper.mobile-open .mobile-backdrop {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
