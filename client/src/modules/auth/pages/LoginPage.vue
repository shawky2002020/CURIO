<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../../stores/auth.store.js';
import { useToastStore } from '../../../stores/toast.store.js';
import AuthCard from '../components/AuthCard.vue';
import LoginForm from '../components/LoginForm.vue';
import GoogleLoginButton from '../components/GoogleLoginButton.vue';

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

// Watch for authentication state changes (e.g. after successful OAuth or login)
watch(() => authStore.isAuthenticated, () => {
  checkAuthAndRedirect();
});

const handleSuccess = () => {
  toastStore.success('Welcome back to your Curio world.');
  const redirect = route.query.redirect as string;
  router.push(redirect || getDashboardRoute(authStore.user?.role));
};
</script>

<template>
  <div class="login-page-view">
    <AuthCard class="motion-scale-in">
      <!-- Title & Branding -->
      <header class="auth-header">
        <span class="auth-eyebrow">WELCOME BACK, CURATOR</span>
        <h1 class="auth-title">Step Into Your Curio World</h1>
        <p class="auth-subtitle">Manage saved finds, secure details, and your curated shopping journey.</p>
      </header>

      <!-- Modular Login Form -->
      <LoginForm @success="handleSuccess" />

      <!-- Divider -->
      <div class="divider" aria-hidden="true">
        <span class="divider-text">Or sign in with</span>
      </div>

      <!-- Social OAuth CTA (Official Google Button) -->
      <GoogleLoginButton
        @success="handleSuccess"
      />

      <!-- Navigation Linkages -->
      <footer class="auth-footer">
        <p class="footer-text">
          New to the curation circle? 
          <router-link to="/auth/register" class="auth-link">
            Create Account
          </router-link>
        </p>
      </footer>
    </AuthCard>
  </div>
</template>

<style scoped>
.login-page-view {
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

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 24px 0;
  color: var(--color-border);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 2px solid var(--color-border);
}

.divider:not(:empty)::before {
  margin-right: .75em;
}

.divider:not(:empty)::after {
  margin-left: .75em;
}

.divider-text {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--color-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
