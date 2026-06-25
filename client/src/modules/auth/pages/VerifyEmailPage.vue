<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import BaseLoader from '../../../components/ui/BaseLoader.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';

const route = useRoute();
const verifying = ref(true);
const success = ref(false);
const message = ref('');

onMounted(async () => {
  const token = route.query.token as string;
  if (!token) {
    verifying.value = false;
    success.value = false;
    message.value = 'Invalid or missing verification token.';
    return;
  }

  // Simulate API call
  setTimeout(() => {
    verifying.value = false;
    success.value = true;
    message.value = 'Your email has been verified successfully! You can now log in.';
  }, 2000);
});
</script>

<template>
  <div class="verify-email-page">
    <h2 class="title">Email Verification</h2>

    <BaseLoader v-if="verifying" />
    
    <div v-else class="result">
      <BaseAlert :type="success ? 'success' : 'error'" :message="message" />
      <router-link v-if="success" to="/auth/login" class="login-link">Go to Login</router-link>
    </div>
  </div>
</template>

<style scoped>
.verify-email-page {
  padding: 2.5rem;
  text-align: center;
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f3f4f6;
  margin-bottom: 2rem;
}

.login-link {
  display: inline-block;
  margin-top: 1.5rem;
  color: #6366f1;
  text-decoration: none;
  font-weight: 600;
}

.login-link:hover {
  text-decoration: underline;
}
</style>
