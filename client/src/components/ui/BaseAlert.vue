<script setup lang="ts">
import { ref, computed } from 'vue';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from '@lucide/vue';

/**
 * BaseAlert Component
 * Beautifully styled banners with type-specific icon representations and close support.
 */
interface Props {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  closable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  title: '',
  closable: false,
});

const isVisible = ref(true);

const handleClose = () => {
  isVisible.value = false;
};

// Compute dynamic icon component based on alert type
const alertIcon = computed(() => {
  switch (props.type) {
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return XCircle;
    case 'info':
    default:
      return Info;
  }
});
</script>

<template>
  <div
    v-if="isVisible"
    :class="['base-alert', `alert-${type}`]"
    role="alert"
    aria-live="polite"
  >
    <div class="alert-body">
      <!-- Icon Indicator -->
      <div class="alert-icon-container" aria-hidden="true">
        <component :is="alertIcon" class="alert-icon-svg" />
      </div>

      <div class="alert-text">
        <h4 v-if="title" class="alert-title">{{ title }}</h4>
        <p class="alert-message">{{ message }}</p>
      </div>
    </div>

    <!-- Dismiss CTA -->
    <button
      v-if="closable"
      type="button"
      class="close-button"
      @click="handleClose"
      aria-label="Dismiss alert"
    >
      <X class="close-icon" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.base-alert {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  margin-bottom: 16px;
  box-sizing: border-box;
  text-align: left;
}

.alert-body {
  display: flex;
  gap: 12px;
}

.alert-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-icon-svg {
  width: 20px;
  height: 20px;
  color: currentColor;
}

.alert-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.alert-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: currentColor;
}

.alert-message {
  margin: 0;
  font-size: 0.875rem;
  line-height: 145%;
  color: currentColor;
  opacity: 0.9;
}

/* Color Theming */
.alert-info {
  background-color: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.15);
  color: #1e40af;
}

.alert-success {
  background-color: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.15);
  color: #065f46;
}

.alert-warning {
  background-color: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.15);
  color: #92400e;
}

.alert-error {
  background-color: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.15);
  color: #991b1b;
}

/* Dark theme overrides for alert readability */
@media (prefers-color-scheme: dark) {
  .alert-info {
    color: #93c5fd;
    background-color: rgba(59, 130, 246, 0.12);
  }
  .alert-success {
    color: #6ee7b7;
    background-color: rgba(16, 185, 129, 0.12);
  }
  .alert-warning {
    color: #fcd34d;
    background-color: rgba(245, 158, 11, 0.12);
  }
  .alert-error {
    color: #fca5a5;
    background-color: rgba(239, 68, 68, 0.12);
  }
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: currentColor;
  opacity: 0.6;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
  margin-top: -2px;
  margin-right: -4px;
}

.close-button:hover {
  opacity: 1;
}

.close-button:focus-visible {
  outline: 2px solid currentColor;
}

.close-icon {
  width: 16px;
  height: 16px;
}
</style>
