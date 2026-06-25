<script setup lang="ts">
// Reusable UI Loader
defineProps<{
  fullscreen?: boolean;
}>();
</script>

<template>
  <div :class="['loader-container', { 'fullscreen': fullscreen }]">
    <div class="spinner"></div>
  </div>
</template>

<style scoped>
.loader-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(11, 15, 25, 0.8);
  backdrop-filter: blur(8px);
  z-index: 9999;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid rgba(99, 102, 241, 0.1);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
