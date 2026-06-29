<script setup lang="ts">
/**
 * BaseConfirmDialog Component
 * Generic popup confirmation dialog to replace standard window.confirm.
 */
import { X, AlertTriangle, HelpCircle } from '@lucide/vue';
import { computed } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger' | 'warning';
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'primary',
  loading: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const handleClose = () => {
  if (props.loading) return;
  emit('update:modelValue', false);
  emit('cancel');
};

const handleConfirm = () => {
  emit('confirm');
};

const iconComponent = computed(() => {
  if (props.variant === 'danger' || props.variant === 'warning') {
    return AlertTriangle;
  }
  return HelpCircle;
});
</script>

<template>
  <Transition name="confirm-fade">
    <div v-if="modelValue" class="confirm-overlay" @click.self="handleClose" role="dialog" aria-modal="true">
      <div class="confirm-card">
        <!-- Close CTA -->
        <button type="button" class="close-btn" @click="handleClose" :disabled="loading" aria-label="Close dialog">
          <X class="close-icon" />
        </button>

        <div class="confirm-content">
          <!-- Icon Banner -->
          <div :class="['icon-wrapper', `variant-${variant}`]">
            <component :is="iconComponent" class="icon-svg" />
          </div>

          <!-- Typography -->
          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-message">{{ message }}</p>
        </div>

        <!-- Footer Actions -->
        <footer class="confirm-footer">
          <button
            type="button"
            class="action-btn btn-cancel"
            @click="handleClose"
            :disabled="loading"
          >
            {{ cancelLabel }}
          </button>
          <button
            type="button"
            :class="['action-btn', 'btn-confirm', `btn-${variant}`]"
            @click="handleConfirm"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner"></span>
            <span v-else>{{ confirmLabel }}</span>
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 20, 32, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.confirm-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
  padding: 32px 24px 24px 24px;
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform var(--duration-base) var(--ease-spring);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover:not(:disabled) {
  background-color: var(--color-bg-alt);
  color: var(--color-text);
}

.close-icon {
  width: 18px;
  height: 18px;
}

.confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.icon-wrapper.variant-primary {
  background-color: rgba(23, 20, 63, 0.1);
  color: var(--color-primary);
}

.icon-wrapper.variant-danger {
  background-color: rgba(229, 72, 77, 0.1);
  color: var(--color-danger);
}

.icon-wrapper.variant-warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.icon-svg {
  width: 28px;
  height: 28px;
}

.confirm-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 8px 0;
}

.confirm-message {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: var(--color-muted);
  margin: 0;
  line-height: 1.5;
}

.confirm-footer {
  display: flex;
  width: 100%;
  gap: 12px;
  box-sizing: border-box;
}

.action-btn {
  flex: 1;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-cancel {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-cancel:hover:not(:disabled) {
  background-color: var(--color-bg-alt);
}

.btn-confirm {
  border: none;
  color: white;
}

.btn-confirm.btn-primary {
  background-color: var(--color-primary);
}

.btn-confirm.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-soft);
}

.btn-confirm.btn-danger {
  background-color: var(--color-danger);
}

.btn-confirm.btn-danger:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-confirm.btn-warning {
  background-color: var(--color-warning);
}

.btn-confirm.btn-warning:hover:not(:disabled) {
  opacity: 0.9;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Spinner anim */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}

.confirm-fade-enter-active .confirm-card {
  animation: popIn var(--duration-base) var(--ease-spring);
}

.confirm-fade-leave-active .confirm-card {
  transition: transform var(--duration-fast) var(--ease-out);
  transform: scale(0.95);
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

@keyframes popIn {
  0% {
    transform: scale(0.9) translateY(10px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}
</style>
