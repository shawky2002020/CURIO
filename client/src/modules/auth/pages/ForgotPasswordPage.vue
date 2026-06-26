<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AuthCard from '../components/AuthCard.vue';
import BaseInput from '../../../components/ui/BaseInput.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';
import { validateEmail } from '../../../utils/validation.js';
import { authApi } from '../../../api/auth.api.js';
import { useToastStore } from '../../../stores/toast.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';

const email = ref('');
const emailError = ref('');
const loading = ref(false);
const message = ref('');
const success = ref(false);

const toastStore = useToastStore();
const authStore = useAuthStore();

onMounted(() => {
  authStore.error = null; // Clear any stale global auth errors on load
});

const validateForm = () => {
  if (!email.value) {
    emailError.value = 'Email address is required.';
    return false;
  }
  if (!validateEmail(email.value)) {
    emailError.value = 'Please enter a valid email address.';
    return false;
  }
  emailError.value = '';
  return true;
};

const handleRequestReset = async () => {
  if (!validateForm()) return;

  loading.value = true;
  message.value = '';
  
  try {
    const response = await authApi.forgotPassword(email.value);
    loading.value = false;
    success.value = true;
    const successMsg = response.message || 'A secure password recovery link has been dispatched to your email address.';
    message.value = successMsg;
    toastStore.success(successMsg);
  } catch (err: any) {
    loading.value = false;
    success.value = false;
    const errorMsg = err.response?.data?.message || 'Failed to request password reset. Please try again.';
    message.value = errorMsg;
    toastStore.error(errorMsg);
  }
};
</script>

<template>
  <div class="forgot-password-view">
    <AuthCard class="motion-scale-in">
      <header class="auth-header">
        <span class="auth-eyebrow">PORTAL SECURITY RECOVERY</span>
        <h1 class="auth-title">Recover Key</h1>
        <p class="auth-subtitle">Provide your email to receive secure recovery credentials</p>
      </header>

      <BaseAlert
        v-if="message"
        :type="success ? 'success' : 'error'"
        :message="message"
        class="forgot-alert"
      />

      <form v-if="!success" @submit.prevent="handleRequestReset" novalidate class="form-layout">
        <!-- Email Input -->
        <BaseInput
          id="recovery-email"
          v-model="email"
          type="email"
          label="Email Address"
          placeholder="name@example.com"
          :error="emailError"
          required
          autocomplete="email"
        />

        <!-- Submit -->
        <BaseButton
          type="submit"
          :loading="loading"
          fullWidth
          class="submit-cta"
        >
          Send Recovery Link
        </BaseButton>
      </form>

      <!-- Back to Login Navigation -->
      <footer class="auth-footer">
        <router-link to="/auth/login" class="back-link">
          Return to Sign In
        </router-link>
      </footer>
    </AuthCard>
  </div>
</template>

<style scoped>
.forgot-password-view {
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
  letter-spacing: 0.15em;
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

.forgot-alert {
  margin-bottom: 24px;
}

.form-layout {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.submit-cta {
  margin-top: 12px;
}

.auth-footer {
  margin-top: 32px;
  border-top: 2px solid var(--color-border);
  padding-top: 24px;
}

.back-link {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-muted);
  text-decoration: none;
  transition: all var(--duration-fast) var(--ease-spring);
  border-bottom: 2px solid transparent;
  display: inline-block;
}

.back-link:hover {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
</style>
