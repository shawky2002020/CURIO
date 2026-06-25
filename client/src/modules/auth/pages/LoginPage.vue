<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../stores/auth.store.js';
import BaseInput from '../../../components/ui/BaseInput.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';

const email = ref('');
const password = ref('');
const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  try {
    await authStore.login({ email: email.value, password: password.value });
    router.push({ name: 'profile' });
  } catch (err) {
    // Error is handled in store state
  }
};
</script>

<template>
  <div class="login-page">
    <h2 class="title">Welcome Back</h2>
    <p class="subtitle">Please sign in to continue your premium shopping</p>

    <BaseAlert v-if="authStore.error" type="error" :message="authStore.error" />

    <form @submit.prevent="handleLogin" class="form">
      <BaseInput
        id="email"
        v-model="email"
        type="email"
        label="Email Address"
        placeholder="you@example.com"
        required
      />

      <BaseInput
        id="password"
        v-model="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        required
      />

      <div class="actions">
        <router-link to="/auth/forgot-password" class="forgot-link">Forgot password?</router-link>
      </div>

      <BaseButton type="submit" :loading="authStore.loading">
        Sign In
      </BaseButton>
    </form>

    <div class="divider">
      <span>or</span>
    </div>

    <!-- Google OAuth Button placeholder -->
    <button class="google-btn">
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" class="google-icon" />
      Continue with Google
    </button>

    <p class="footer-text">
      Don't have an account?
      <router-link to="/auth/register" class="link">Create one</router-link>
    </p>
  </div>
</template>

<style scoped>
.login-page {
  padding: 2.5rem;
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  color: #f3f4f6;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 0.9rem;
  color: #9ca3af;
  text-align: center;
  margin-bottom: 2rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}

.forgot-link {
  font-size: 0.85rem;
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.forgot-link:hover {
  color: #818cf8;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: #4b5563;
  font-size: 0.85rem;
}

.divider::before, .divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.divider:not(:empty)::before {
  margin-right: .5em;
}

.divider:not(:empty)::after {
  margin-left: .5em;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f3f4f6;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.google-btn:hover {
  background-color: rgba(255, 255, 255, 0.06);
}

.google-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.footer-text {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #9ca3af;
}

.link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}
</style>
