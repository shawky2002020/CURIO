<script setup lang="ts">
import { useToastStore } from '../../stores/toast.store.js';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from '@lucide/vue';

const toastStore = useToastStore();

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return CheckCircle;
    case 'error': return XCircle;
    case 'warning': return AlertTriangle;
    case 'info':
    default: return Info;
  }
};
</script>

<template>
  <div class="toast-container" aria-live="assertive" aria-atomic="true">
    <TransitionGroup name="toast-list">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :class="['toast-card', `toast-${toast.type}`]"
      >
        <component :is="getIcon(toast.type)" class="toast-icon" />
        <span class="toast-message">{{ toast.message }}</span>
        <button
          type="button"
          class="toast-close-btn"
          @click="toastStore.remove(toast.id)"
          aria-label="Close notification"
        >
          <X class="toast-close-icon" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 380px;
  width: 100%;
  pointer-events: none;
}

.toast-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 30px rgba(16, 16, 24, 0.12);
  pointer-events: auto;
  box-sizing: border-box;
}

.toast-message {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-primary);
  flex-grow: 1;
  text-align: left;
  line-height: 1.4;
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.toast-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-muted);
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.toast-close-btn:hover {
  color: var(--color-primary);
  background-color: var(--color-bg-alt);
}

.toast-close-icon {
  width: 14px;
  height: 14px;
}

/* Color Types */
.toast-success {
  border-color: var(--color-success);
}
.toast-success .toast-icon {
  color: var(--color-success);
}

.toast-error {
  border-color: var(--color-danger);
}
.toast-error .toast-icon {
  color: var(--color-danger);
}

.toast-warning {
  border-color: var(--color-warning);
}
.toast-warning .toast-icon {
  color: var(--color-warning);
}

.toast-info {
  border-color: var(--color-primary);
}
.toast-info .toast-icon {
  color: var(--color-primary);
}

/* Vue Animations */
.toast-list-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-list-leave-active {
  transition: all 0.3s ease-in;
}
.toast-list-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}
.toast-list-leave-to {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}
</style>
