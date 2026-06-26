<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AuthCard from '../components/AuthCard.vue';
import BaseLoader from '../../../components/ui/BaseLoader.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseInput from '../../../components/ui/BaseInput.vue';
import { authApi } from '../../../api/auth.api.js';
import { useAuthStore } from '../../../stores/auth.store.js';

const route = useRoute();
const authStore = useAuthStore();

const verifying = ref(true);
const success = ref(false);
const message = ref('');
const email = ref('');
const emailError = ref('');
const resending = ref(false);
const resendSuccess = ref(false);

const verifyToken = async () => {
  const token = route.query.token as string;
  if (!token) {
    verifying.value = false;
    success.value = false;
    message.value = 'Verification token is missing or invalid.';
    return;
  }

  try {
    const response = await authApi.verifyEmail(token);
    verifying.value = false;
    success.value = true;
    message.value = response.message || 'Your email address has been successfully verified! You can now access all premium features.';
  } catch (err: any) {
    verifying.value = false;
    success.value = false;
    message.value = err.response?.data?.message || 'Verification token is invalid or has expired.';
  }
};

const handleResend = async () => {
  if (!email.value) {
    emailError.value = 'Please enter your email address to resend.';
    return;
  }
  
  emailError.value = '';
  resending.value = true;
  resendSuccess.value = false;
  
  try {
    await authApi.resendVerification(email.value);
    resending.value = false;
    resendSuccess.value = true;
  } catch (err: any) {
    resending.value = false;
    emailError.value = err.response?.data?.message || 'Failed to resend verification email.';
  }
};

onMounted(() => {
  if (authStore.user?.email) {
    email.value = authStore.user.email;
  }
  verifyToken();
});
</script>

<template>
  <div class="verify-email-view">
    <AuthCard class="motion-scale-in">
      <header class="auth-header">
        <span class="auth-eyebrow">PORTAL SECURITY VERIFICATION</span>
        <h1 class="auth-title">Verify Email</h1>
        <p class="auth-subtitle">Establishing authenticity handshake with CURIO security servers</p>
      </header>

      <!-- 1. Verifying State -->
      <div v-if="verifying" class="verifying-state">
        <BaseLoader text="Verifying your token with our servers..." />
      </div>

      <!-- 2. Result State -->
      <div v-else class="result-state">
        <BaseAlert
          :type="success ? 'success' : 'error'"
          :message="message"
          class="result-alert"
        />

        <!-- Success CTA -->
        <router-link v-if="success" to="/auth/login" class="action-link">
          <BaseButton variant="primary" fullWidth>
            Access Portal
          </BaseButton>
        </router-link>

        <!-- Expired/Error Resend Actions -->
        <div v-else class="error-actions">
          <BaseAlert
            v-if="resendSuccess"
            type="success"
            message="A new verification link has been successfully dispatched."
            class="resend-alert"
          />
          
          <p class="error-explanation">
            Verification links expire after 24 hours. Enter your email below to receive a new secure verification link.
          </p>

          <BaseInput
            id="resend-email"
            v-model="email"
            type="email"
            placeholder="name@example.com"
            :error="emailError"
            required
          />
          
          <BaseButton
            variant="secondary"
            :loading="resending"
            @click="handleResend"
            fullWidth
            class="resend-cta"
          >
            Resend Verification Link
          </BaseButton>
          
          <router-link to="/auth/login" class="back-to-login">
            Return to Sign In
          </router-link>
        </div>
      </div>
    </AuthCard>
  </div>
</template>

<style scoped>
.verify-email-view {
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

.verifying-state {
  padding: 20px 0;
}

.result-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-alert {
  margin-bottom: 8px;
}

.resend-alert {
  margin-bottom: 12px;
}

.action-link {
  text-decoration: none;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-explanation {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: var(--color-text);
  line-height: 1.6;
  margin: 0;
  text-align: left;
}

.resend-cta {
  margin-top: 8px;
}

.back-to-login {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-muted);
  text-decoration: none;
  margin-top: 12px;
  align-self: center;
  border-bottom: 2px solid transparent;
  display: inline-block;
  transition: all var(--duration-fast) var(--ease-spring);
}

.back-to-login:hover {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
</style>
