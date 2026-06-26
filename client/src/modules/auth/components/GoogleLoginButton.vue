<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuthStore } from '../../../stores/auth.store.js';

const authStore = useAuthStore();
const gBtnContainer = ref<HTMLElement | null>(null);
const showFallback = ref(false);
const loading = ref(false);
const retryCount = ref(0);
const maxRetries = 30; // 3 seconds total wait time
const isDev = import.meta.env.DEV;

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const handleCredentialResponse = async (response: any) => {
  loading.value = true;
  try {
    const credentialToken = response.credential;
    await authStore.googleLogin(credentialToken);
    emit('success');
  } catch (err) {
    console.error('Google verification request failed:', err);
  } finally {
    loading.value = false;
  }
};

const handleFallbackClick = () => {
  if (isDev) {
    handleCredentialResponse({ credential: 'mock_google_credential_token' });
  } else {
    console.warn('Google Identity Services script failed to load.');
  }
};

onMounted(() => {
  const initGoogleBtn = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      const google = (window as any).google;
      
      try {
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
              logo_alignment: 'left'
            }
          );
        }
      } catch (err) {
        console.error('Error rendering Google Sign-In button, switching to fallback:', err);
        showFallback.value = true;
      }
    } else {
      if (retryCount.value < maxRetries) {
        retryCount.value++;
        setTimeout(initGoogleBtn, 100);
      } else {
        // Script failed to load (e.g. adblocker, offline)
        console.warn('Google Identity Services script not available. Displaying fallback.');
        showFallback.value = true;
      }
    }
  };

  initGoogleBtn();
});
</script>

<template>
  <div class="google-btn-wrapper">
    <!-- 1. Official Google Identity Services button container -->
    <div v-show="!showFallback" ref="gBtnContainer" class="google-btn-container"></div>
    
    <!-- 2. Fallback / Simulation Button -->
    <button 
      v-if="showFallback" 
      @click="handleFallbackClick" 
      :disabled="loading"
      class="google-fallback-btn"
      type="button"
    >
      <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span class="btn-text">
        {{ loading ? 'Signing in...' : (isDev ? 'Continue with Google (Simulation)' : 'Continue with Google') }}
      </span>
    </button>
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

/* Fallback / Simulation Button Styling */
.google-fallback-btn {
  width: 100%;
  max-width: 400px;
  height: 48px;
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-spring);
  box-shadow: var(--shadow-soft);
}

.google-fallback-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  background-color: var(--color-bg-alt);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 16, 24, 0.06);
}

.google-fallback-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.google-fallback-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  flex-shrink: 0;
}

.btn-text {
  letter-spacing: 0.02em;
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
