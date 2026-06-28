<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth.store.js';
import { useToastStore } from '../stores/toast.store.js';
import { useRouter, useRoute } from 'vue-router';
import { Lock, Sparkles } from '@lucide/vue';
import { authApi } from '../api/auth.api.js';

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();
const route = useRoute();

const resending = ref(false);
const resendCooldown = ref(0);
let cooldownInterval: number | null = null;

const startCooldown = () => {
  resendCooldown.value = 60;
  cooldownInterval = window.setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--;
    } else {
      stopCooldown();
    }
  }, 1000);
};

const stopCooldown = () => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
    cooldownInterval = null;
  }
};

onUnmounted(() => {
  stopCooldown();
});

const handleResendVerification = async () => {
  if (!authStore.user?.email || resending.value || resendCooldown.value > 0) return;
  
  resending.value = true;
  try {
    const response = await authApi.resendVerification(authStore.user.email);
    toastStore.success(response.message || 'Verification link dispatched successfully.');
    startCooldown();
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'Failed to dispatch verification link.';
    toastStore.error(errorMsg);
  } finally {
    resending.value = false;
  }
};

interface NavItem {
  label: string;
  to: string;
  matchNames: string[];
}

const navItems = computed<NavItem[]>(() => {
  const items = [
    { label: 'Catalog', to: '/', matchNames: ['home'] }
  ];
  
  if (authStore.isAuthenticated) {
    items.push(
      { label: 'Curation', to: '/wishlist', matchNames: ['wishlist'] },
      { label: 'Member Hub', to: '/profile', matchNames: ['profile', 'profile-edit'] }
    );

    if (authStore.user?.role === 'admin' || authStore.user?.role === 'seller') {
      items.push({ label: 'Studio', to: '/admin/products', matchNames: ['admin-products', 'admin-categories'] });
    }
  }
  
  return items;
});

const isNavItemActive = (item: NavItem) => {
  return item.matchNames.includes(String(route.name));
};

const handleLogout = async () => {
  await authStore.logout();
  toastStore.success('Successfully logged out. See you soon.');
  router.push({ name: 'login' });
};
</script>

<template>
  <div class="main-layout">
    <!-- Premium Verification Banner -->
    <div 
      v-if="authStore.isAuthenticated && authStore.user && !authStore.user.emailVerified" 
      class="verification-banner"
      role="alert"
    >
      <div class="banner-container">
        <span class="banner-text">
          Your Curio registry is currently unverified. Let's establish authenticity to secure your member privileges.
        </span>
        <button 
          @click="handleResendVerification" 
          :disabled="resendCooldown > 0 || resending"
          class="banner-cta"
        >
          <span v-if="resending">Dispatching...</span>
          <span v-else-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
          <span v-else>Dispatch Verification Link</span>
        </button>
      </div>
    </div>

    <!-- Header Navigation -->
    <header class="app-header">
      <div class="header-container">
        <!-- Bold, Playful Brand Logo -->
        <router-link to="/" class="logo">
          curio<span class="logo-dot">.</span>
        </router-link>
        
        <!-- Capsule Primary Navigation -->
        <nav class="navigation-bar" aria-label="Primary navigation">
          <router-link 
            v-for="item in navItems" 
            :key="item.label"
            :to="item.to" 
            :class="['nav-item', { 'nav-item--active': isNavItemActive(item) }]"
            :aria-current="isNavItemActive(item) ? 'page' : undefined"
          >
            {{ item.label }}
          </router-link>
          
          <template v-if="authStore.isAuthenticated">
            <button @click="handleLogout" class="btn-logout" aria-label="Sign out of account">
              Logout
            </button>
          </template>
          
          <template v-else>
            <router-link to="/auth/login" class="nav-item nav-item-cta">
              Sign In
            </router-link>
          </template>
        </nav>
      </div>
    </header>

    <!-- Main Content Area with Page Entrance Transition -->
    <main class="main-content">
      <div class="content-container motion-fade-up">
        <router-view />
      </div>
    </main>

    <!-- Playful Premium Footer -->
    <footer class="app-footer">
      <div class="footer-container">
        <div class="footer-columns">
          <div class="footer-col brand-col">
            <span class="footer-logo">curio<span class="logo-dot">.</span></span>
            <p class="footer-manifesto">
              A playful, curated space dedicated to beautiful accessories, premium design, and unique objects. Making shopping joyful, tactile, and highly secure.
            </p>
            <div class="trust-badge-row">
              <span class="trust-pill" aria-label="Verified security">
                <Lock class="trust-icon" /> Secure Registry
              </span>
              <span class="trust-pill" aria-label="Authentic curation">
                <Sparkles class="trust-icon" /> Verified Curations
              </span>
            </div>
          </div>
          
          <div class="footer-col link-col">
            <span class="footer-heading">Curation</span>
            <ul class="footer-links">
              <li><router-link to="/" class="site-footer__link">Latest Arrivals</router-link></li>
              <li><router-link to="/wishlist" class="site-footer__link">Your Saved Curations</router-link></li>
              <li><a href="#" class="site-footer__link">Unique Objects</a></li>
              <li><a href="#" class="site-footer__link">Our Atelier</a></li>
            </ul>
          </div>
          
          <div class="footer-col link-col">
            <span class="footer-heading">Member Hub</span>
            <ul class="footer-links">
              <li><router-link to="/profile" class="site-footer__link">Security Settings</router-link></li>
              <li><a href="#" class="site-footer__link">Onboarding Guide</a></li>
              <li><a href="#" class="site-footer__link">Support Circle</a></li>
              <li><a href="#" class="site-footer__link">Handshake Registry</a></li>
            </ul>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p class="footer-copy">&copy; 2026 CURIO. Crafted for a joyful shopping experience.</p>
          <span class="footer-serial">HANDSHAKE STATUS // OK</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg);
  color: var(--color-text);
  box-sizing: border-box;
}

.app-header {
  background-color: rgba(255, 248, 239, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 2px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all var(--duration-base) var(--ease-out);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
}

.logo {
  font-family: var(--font-heading);
  font-size: 2.1rem;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
  letter-spacing: -0.04em;
  transition: transform var(--duration-fast) var(--ease-spring);
  display: inline-flex;
  align-items: baseline;
}

.logo:hover {
  transform: scale(1.05) rotate(-2deg);
}

.logo-dot {
  color: var(--color-accent);
}

.navigation-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-bg-alt);
  padding: 6px;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
}

.nav-item {
  color: var(--color-primary);
  text-decoration: none;
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 9999px;
  transition: all var(--duration-base) var(--ease-spring);
  border: 2px solid transparent;
}

.nav-item:hover {
  color: var(--color-accent);
  background-color: var(--color-surface);
}

/* Strict custom active nav pill styling */
.nav-item--active {
  background-color: var(--color-primary) !important;
  color: var(--color-surface) !important;
}

.btn-logout {
  background: none;
  border: none;
  color: var(--color-muted);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  padding: 8px 18px;
  cursor: pointer;
  border-radius: 9999px;
  transition: all var(--duration-base) var(--ease-spring);
}

.btn-logout:hover {
  color: var(--color-danger);
  background-color: rgba(229, 72, 77, 0.08);
}

.nav-item-cta {
  background-color: var(--color-accent);
  color: var(--color-surface) !important;
  box-shadow: var(--shadow-button);
}

.nav-item-cta:hover {
  background-color: var(--color-primary) !important;
  color: var(--color-surface) !important;
  transform: translateY(-1px);
}

.main-content {
  flex-grow: 1;
  width: 100%;
  box-sizing: border-box;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 50px 24px;
}

/* Playful Premium Footer */
.app-footer {
  background-color: var(--color-bg-alt);
  border-top: 2px solid var(--color-border);
  padding: 64px 24px var(--space-8);
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-columns {
  display: grid;
  grid-template-columns: 1.8fr 1fr 1fr;
  gap: 64px;
  margin-bottom: 48px;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.footer-logo {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.04em;
}

.footer-manifesto {
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--color-ink-soft);
  max-width: 380px;
}

.trust-badge-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.trust-pill {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  background-color: var(--color-surface);
  color: var(--color-primary);
  padding: 6px 14px;
  border-radius: 99px;
  border: 1px solid var(--color-border);
}

.footer-heading {
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 8px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--color-border);
  padding-top: 24px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-muted);
}

.footer-copy {
  margin: 0;
}

.footer-serial {
  letter-spacing: 0.05em;
  color: var(--color-accent-3);
  font-weight: 700;
}

@media (max-width: 768px) {
  .header-container {
    padding: 16px;
    flex-direction: column;
    gap: 16px;
  }
  
  .footer-columns {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .content-container {
    padding: 32px 16px;
  }
}

.trust-icon {
  width: 14px;
  height: 14px;
  display: inline-block;
  vertical-align: -2px;
  margin-right: 4px;
}

/* Premium Verification Banner */
.verification-banner {
  background: linear-gradient(135deg, var(--color-primary-soft), var(--color-primary));
  color: var(--color-bg);
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 500;
  padding: 12px 24px;
  border-bottom: 2px solid var(--color-accent);
  position: relative;
  z-index: 101;
  text-align: center;
  box-shadow: 0 4px 12px rgba(23, 20, 63, 0.15);
  animation: slideDown 0.4s var(--ease-spring);
}

.banner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
  flex-wrap: wrap;
}

.banner-text {
  letter-spacing: -0.01em;
  opacity: 0.95;
}

.banner-cta {
  background-color: var(--color-accent);
  color: var(--color-surface);
  border: none;
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 16px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-spring);
  box-shadow: 0 4px 10px rgba(255, 107, 53, 0.25);
}

.banner-cta:hover:not(:disabled) {
  background-color: var(--color-bg);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.banner-cta:disabled {
  background-color: var(--color-bg-alt);
  color: var(--color-muted);
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.7;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
