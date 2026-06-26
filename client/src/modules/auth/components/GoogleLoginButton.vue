<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuthStore } from '../../../stores/auth.store.js';

const authStore = useAuthStore();
const gBtnContainer = ref<HTMLElement | null>(null);

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const handleCredentialResponse = async (response: any) => {
  try {
    const credentialToken = response.credential;
    await authStore.googleLogin(credentialToken);
    emit('success');
  } catch (err) {
    console.error('Google verification request failed:', err);
  }
};

onMounted(() => {
  const initGoogleBtn = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      const google = (window as any).google;
      
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      if (gBtnContainer.value) {
        google.accounts.id.renderButton(
          gBtnContainer.value,
          {
            theme: 'filled_black',
            size: 'large',
            width: gBtnContainer.value.clientWidth || 340,
            shape: 'square',
            text: 'continue_with',
            logo_alignment: 'center'
          }
        );
      }
    } else {
      // Retry in 100ms if script is still loading asynchronously
      setTimeout(initGoogleBtn, 100);
    }
  };

  initGoogleBtn();
});
</script>

<template>
  <div class="google-btn-wrapper">
    <!-- Google Identity Services renders the official iframe button here -->
    <div ref="gBtnContainer" class="google-btn-container"></div>
  </div>
</template>

<style scoped>
.google-btn-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.google-btn-container {
  width: 100%;
  min-height: 44px;
  display: flex;
  justify-content: center;
}

/* Force standard dark gallery style around the iframe border */
:deep(iframe) {
  border: 1px solid var(--color-border) !important;
  transition: border-color 0.25s ease;
}

:deep(iframe):hover {
  border-color: var(--color-primary) !important;
}
</style>
