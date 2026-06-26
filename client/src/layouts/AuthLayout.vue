<script setup lang="ts">
import AuthHeroScene from '../modules/auth/components/AuthHeroScene.vue';
</script>

<template>
  <div class="auth-layout">
    <!-- Left Panel: Playful Brand Showcase (Houses the advanced Curio e-commerce scene) -->
    <section class="auth-brand-panel" aria-label="Curio Showcase">
      <!-- Floating decorative circles for playful backdrop -->
      <div class="bubble bubble-1"></div>
      <div class="bubble bubble-2"></div>
      <div class="bubble bubble-3"></div>
      
      <AuthHeroScene />
    </section>

    <!-- Right Panel: Rounded Form Card Container -->
    <section class="auth-form-panel" aria-label="Credentials Portal">
      <div class="form-container motion-fade-up">
        <router-view />
      </div>
    </section>
  </div>
</template>

<style scoped>
.auth-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  min-height: 100vh;
  background-color: var(--color-bg);
}

/* Left Brand Panel */
.auth-brand-panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  background: linear-gradient(135deg, #17143f 0%, #2e2a72 100%);
  border-right: 2px solid var(--color-border);
  overflow: hidden;
}

/* Playful floating bubbles */
.bubble {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 107, 53, 0.12) 0%, rgba(255, 107, 53, 0) 70%);
  pointer-events: none;
}

.bubble-1 {
  width: 500px;
  height: 500px;
  top: -100px;
  left: -100px;
}

.bubble-2 {
  width: 350px;
  height: 350px;
  bottom: -50px;
  right: -50px;
}

.bubble-3 {
  width: 250px;
  height: 250px;
  top: 40%;
  left: 50%;
}

/* Right Form Panel */
.auth-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: var(--color-bg);
}

.form-container {
  width: 100%;
  max-width: 460px;
  box-sizing: border-box;
}

/* Responsive adjustment */
@media (max-width: 1024px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }
  
  .auth-brand-panel {
    display: none; /* Hide brand panel on mobile for quick credentials access */
  }
  
  .auth-form-panel {
    padding: 32px 16px;
  }
}
</style>
