<script setup lang="ts">
import { ref } from 'vue';
import BaseInput from '../../../components/ui/BaseInput.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';

const email = ref('');
const loading = ref(false);
const message = ref('');
const success = ref(false);

const handleRequest = () => {
  loading.value = true;
  message.value = '';
  // Simulate dispatching email
  setTimeout(() => {
    loading.value = false;
    success.value = true;
    message.value = 'A password recovery link has been dispatched to your email address.';
  }, 1500);
};
</script>

<template>
  <div class="forgot-password-page">
    <h2 class="title">Recover Password</h2>
    <p class="subtitle">Enter your email and we will dispatch recovery steps</p>

    <BaseAlert v-if="message" :type="success ? 'success' : 'error'" :message="message" />

    <form v-if="!success" @submit.prevent="handleRequest" class="form">
      <BaseInput
        id="email"
        v-model="email"
        type="email"
        label="Email Address"
        placeholder="you@example.com"
        required
      />

      <BaseButton type="submit" :loading="loading">
        Dispatch Link
      </BaseButton>
    </form>

    <p class="footer-text">
      Remember password?
      <router-link to="/auth/login" class="link">Sign In</router-link>
    </p>
  </div>
</template>

<style scoped>
.forgot-password-page {
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
