<script setup lang="ts">
// AuthLayout manages the visual backdrop for all credentials and auth pages.
</script>

<template>
  <div class="auth-layout">
    <div class="auth-container">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  padding: 1.5rem;
}

.auth-container {
  width: 100%;
  max-width: 450px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px border rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  overflow: hidden;
}
</style>
