<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AuthCard from '../components/AuthCard.vue';
import BaseInput from '../../../components/ui/BaseInput.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';
import { authApi } from '../../../api/auth.api.js';
import { useToastStore } from '../../../stores/toast.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';

const password = ref('');
const confirmPassword = ref('');
const passwordError = ref('');
const confirmError = ref('');
const loading = ref(false);
const globalError = ref('');
const success = ref(false);
const token = ref('');

const router = useRouter();
const route = useRoute();
const toastStore = useToastStore();
const authStore = useAuthStore();

onMounted(() => {
  authStore.error = null; // Clear any stale global auth errors on load
  const t = route.query.token as string;
  if (!t) {
    globalError.value = 'Security token is missing or invalid. Please request a new recovery link.';
    toastStore.error('Security token is missing.');
  } else {
    token.value = t;
  }
});

const validateForm = () => {
  let isValid = true;

  if (!password.value) {
    passwordError.value = 'Password is required.';
    isValid = false;
  } else if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters.';
    isValid = false;
  } else {
    passwordError.value = '';
  }

  if (!confirmPassword.value) {
    confirmError.value = 'Please confirm your password.';
    isValid = false;
  } else if (password.value !== confirmPassword.value) {
    confirmError.value = 'Passwords do not match.';
    isValid = false;
  } else {
    confirmError.value = '';
  }

  return isValid;
};

const handleReset = async () => {
  if (!token.value) {
    globalError.value = 'Cannot reset password without a valid token.';
    return;
  }

  if (!validateForm()) return;

  globalError.value = '';
  loading.value = true;

  try {
    await authApi.resetPassword({
      token: token.value,
      passwordHash: password.value,
    });
    loading.value = false;
    success.value = true;
    globalError.value = '';
    
    toastStore.success('Password updated successfully. Redirecting to login...');
    
    // Redirect to login after brief delay
    setTimeout(() => {
      router.push({ name: 'login' });
    }, 2500);
  } catch (err: any) {
    loading.value = false;
    success.value = false;
    const errorMsg = err.response?.data?.message || 'Failed to update password. Link may be expired.';
    globalError.value = errorMsg;
    toastStore.error(errorMsg);
  }
};
</script>

<template>
  <div class="reset-password-view">
    <AuthCard class="motion-scale-in">
      <header class="auth-header">
        <span class="auth-eyebrow">PORTAL SECURITY RECOVERY</span>
        <h1 class="auth-title">Reset Password</h1>
        <p class="auth-subtitle">Configure a new secure credentials key for your account</p>
      </header>

      <BaseAlert v-if="globalError" type="error" :message="globalError" class="reset-alert" />
      
      <BaseAlert
        v-if="success"
        type="success"
        message="Password updated successfully! Redirecting you to login..."
        class="reset-alert"
      />

      <form v-if="!success && token" @submit.prevent="handleReset" novalidate class="form-layout">
        <!-- New Password Field -->
        <BaseInput
          id="new-password"
          v-model="password"
          type="password"
          label="New Password"
          placeholder="Minimum 8 characters"
          :error="passwordError"
          required
          autocomplete="new-password"
        />

        <!-- Confirm Password Field -->
        <BaseInput
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="••••••••"
          :error="confirmError"
          required
          autocomplete="new-password"
        />

        <BaseButton
          type="submit"
          :loading="loading"
          fullWidth
          class="submit-cta"
        >
          Update Credentials
        </BaseButton>
      </form>
    </AuthCard>
  </div>
</template>

<style scoped>
.reset-password-view {
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

.reset-alert {
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
</style>
