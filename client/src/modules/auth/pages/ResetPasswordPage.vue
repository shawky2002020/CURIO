<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseInput from '../../../components/ui/BaseInput.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const success = ref(false);
const router = useRouter();

const handleReset = () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.';
    return;
  }
  
  error.value = '';
  loading.value = true;

  // Simulate resetting password
  setTimeout(() => {
    loading.value = false;
    success.value = true;
    setTimeout(() => {
      router.push({ name: 'login' });
    }, 2000);
  }, 1500);
};
</script>

<template>
  <div class="reset-password-page">
    <h2 class="title">Reset Password</h2>
    <p class="subtitle">Enter a new secure password for your account</p>

    <BaseAlert v-if="error" type="error" :message="error" />
    <BaseAlert v-if="success" type="success" message="Password reset successfully! Redirecting to login..." />

    <form v-if="!success" @submit.prevent="handleReset" class="form">
      <BaseInput
        id="password"
        v-model="password"
        type="password"
        label="New Password"
        placeholder="••••••••"
        required
      />

      <BaseInput
        id="confirmPassword"
        v-model="confirmPassword"
        type="password"
        label="Confirm Password"
        placeholder="••••••••"
        required
      />

      <BaseButton type="submit" :loading="loading">
        Reset Password
      </BaseButton>
    </form>
  </div>
</template>

<style scoped>
.reset-password-page {
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
</style>
