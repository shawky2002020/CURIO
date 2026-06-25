<script setup lang="ts">
// Reusable UI Button
defineProps<{
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}>();
</script>

<template>
  <button
    :type="type || 'button'"
    :class="['btn', variant || 'primary']"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="spinner"></span>
    <span v-else><slot /></span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}

.secondary {
  background-color: rgba(255, 255, 255, 0.05);
  color: #f3f4f6;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.secondary:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.08);
}

.danger {
  background-color: #ef4444;
  color: white;
}

.danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
