<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../../stores/auth.store.js';
import { useToastStore } from '../../../stores/toast.store.js';
import AuthCard from '../components/AuthCard.vue';
import RegisterForm from '../components/RegisterForm.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toastStore = useToastStore();

// Redirect user if already authenticated
const getDashboardRoute = (role?: string) => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'seller':
      return '/seller/dashboard';
    default:
      return '/';
  }
};

const checkAuthAndRedirect = () => {
  if (authStore.isAuthenticated) {
    const redirect = route.query.redirect as string;
    router.replace(redirect || getDashboardRoute(authStore.user?.role));
  }
};

onMounted(() => {
  authStore.error = null; // Clear previous authentication errors on page load
  checkAuthAndRedirect();
});

// Watch for authentication state changes (e.g. after successful registration)
watch(() => authStore.isAuthenticated, () => {
  checkAuthAndRedirect();
});

const handleSuccess = () => {
  toastStore.success('Welcome to the Curio curation circle.');
  const redirect = route.query.redirect as string;
  router.push(redirect || getDashboardRoute(authStore.user?.role));
};
</script>

<template>
  <div class="register-page-view">
    <AuthCard class="motion-scale-in">
      <!-- Title & Branding -->
      <header class="auth-header">
        <span class="auth-eyebrow">MEMBER PORTAL ONBOARDING</span>
        <h1 class="auth-title">Create Account</h1>
        <p class="auth-subtitle">Join the CURIO circle to begin archiving your curated collection</p>
      </header>

      <!-- Modular Registration Form -->
      <RegisterForm @success="handleSuccess" />

      <!-- Navigation Linkages -->
      <footer class="auth-footer">
        <p class="footer-text">
          Already registered in the circle? 
          <router-link to="/auth/login" class="auth-link">
            Access Portal
          </router-link>
        </p>
      </footer>
    </AuthCard>
  </div>
</template>

<style scoped>
.register-page-view {
  width: 100%;
  display: flex;
  justify-content: center;
}

.auth-header {
  margin-bottom: 32px;
  text-align: left;
}

.auth-eyebrow {
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: var(--color-accent);
  display: block;
  margin-bottom: 6px;
}

.auth-title {
  font-family: var(--font-heading);
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.auth-subtitle {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--color-muted);
  margin: 0;
}

.auth-footer {
  margin-top: 32px;
  border-top: 2px solid var(--color-border);
  padding-top: 24px;
}

.footer-text {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: var(--color-muted);
  margin: 0;
  text-align: left;
}

.auth-link {
  color: var(--color-accent);
  text-decoration: none;
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 700;
  transition: all var(--duration-fast) var(--ease-spring);
  display: inline-block;
  margin-left: 4px;
  border-bottom: 2px solid transparent;
}

.auth-link:hover {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  transform: translateY(-1px);
}
</style>
