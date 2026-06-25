<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../stores/auth.store.js';
import BaseInput from '../../../components/ui/BaseInput.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';

const fullName = ref('');
const email = ref('');
const password = ref('');
const role = ref<'customer' | 'seller'>('customer');

const authStore = useAuthStore();
const router = useRouter();

const handleRegister = async () => {
  try {
    await authStore.register({
      fullName: fullName.value,
      email: email.value,
      password: password.value,
      role: role.value,
    });
    router.push({ name: 'profile' });
  } catch (err) {
    // Handled in store
  }
};
</script>

<template>
  <div class="register-page">
    <h2 class="title">Create Account</h2>
    <p class="subtitle">Join our premium e-commerce platform today</p>

    <BaseAlert v-if="authStore.error" type="error" :message="authStore.error" />

    <form @submit.prevent="handleRegister" class="form">
      <BaseInput
        id="name"
        v-model="fullName"
        type="text"
        label="Full Name"
        placeholder="Jane Doe"
        required
      />

      <BaseInput
        id="email"
        v-model="email"
        type="email"
        label="Email Address"
        placeholder="jane@example.com"
        required
      />

      <BaseInput
        id="password"
        v-model="password"
        type="password"
        label="Password"
        placeholder="•••••••• (min 8 chars)"
        required
      />

      <div class="role-selector">
        <span class="role-label">Register As:</span>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="role" value="customer" class="radio-input" />
            <span class="custom-radio">Customer</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="role" value="seller" class="radio-input" />
            <span class="custom-radio">Seller</span>
          </label>
        </div>
      </div>

      <BaseButton type="submit" :loading="authStore.loading" class="btn-submit">
        Get Started
      </BaseButton>
    </form>

    <p class="footer-text">
      Already have an account?
      <router-link to="/auth/login" class="link">Sign In</router-link>
    </p>
  </div>
</template>

<style scoped>
.register-page {
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

.role-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.role-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #9ca3af;
}

.radio-group {
  display: flex;
  gap: 1.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f3f4f6;
  cursor: pointer;
  font-size: 0.95rem;
}

.radio-input {
  accent-color: #6366f1;
}

.btn-submit {
  margin-top: 0.5rem;
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
