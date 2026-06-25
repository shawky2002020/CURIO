<script setup lang="ts">
// Reusable UI Alert
defineProps<{
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
}>();
</script>

<template>
  <div :class="['alert', type || 'info']">
    <div class="alert-content">
      <span>{{ message }}</span>
    </div>
  </div>
</template>

<style scoped>
.alert {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid transparent;
}

.success {
  background-color: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.error {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.warning {
  background-color: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.info {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}
</style>
