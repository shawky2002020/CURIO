<script setup lang="ts">
/**
 * BaseModal Component
 * Reusable modal popup container using CURIO design system.
 */
import { X } from '@lucide/vue';

interface Props {
  show: boolean;
  title: string;
  size?: 'sm' | 'md' | 'lg';
}

withDefaults(defineProps<Props>(), {
  show: false,
  size: 'md',
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="handleClose" role="dialog" aria-modal="true">
      <div :class="['modal-card', `size-${size}`]">
        <!-- Header -->
        <header class="modal-header">
          <h3>{{ title }}</h3>
          <button type="button" class="close-modal-btn" @click="handleClose" aria-label="Close modal">
            <X class="close-icon" />
          </button>
        </header>

        <!-- Body -->
        <div class="modal-body">
          <slot></slot>
        </div>

        <!-- Footer -->
        <footer v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
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
  z-index: 1100;
}

.modal-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 90%;
  max-height: 90vh;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform var(--duration-base) var(--ease-spring);
}

.size-sm {
  max-width: 400px;
}

.size-md {
  max-width: 500px;
}

.size-lg {
  max-width: 700px;
}

.modal-header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  box-sizing: border-box;
  flex-shrink: 0;
}

.modal-header h3 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0;
}

.close-modal-btn {
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-modal-btn:hover {
  background-color: var(--color-bg-alt);
  color: var(--color-text);
}

.close-icon {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  box-sizing: border-box;
  flex-grow: 1;
}

.modal-footer {
  height: 64px;
  padding: 0 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--color-border);
  box-sizing: border-box;
  flex-shrink: 0;
}

/* Transition Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}

.modal-fade-enter-active .modal-card {
  animation: popIn var(--duration-base) var(--ease-spring);
}

.modal-fade-leave-active .modal-card {
  transition: transform var(--duration-fast) var(--ease-out);
  transform: scale(0.95);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
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
