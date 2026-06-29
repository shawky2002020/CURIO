<script setup lang="ts">
/**
 * SellerLayout Component
 * Nested layout wrapper for seller partner studio routes.
 */
import { ref } from 'vue';
import Sidebar from '../components/layout/Sidebar.vue';
import Header from '../components/layout/Header.vue';

const mobileSidebarOpen = ref(false);
</script>

<template>
  <div class="dashboard-layout-root">
    <Sidebar 
      role="seller" 
      :isOpen="mobileSidebarOpen" 
      @close-sidebar="mobileSidebarOpen = false" 
    />
    
    <div class="dashboard-main-area">
      <Header 
        :isAdmin="false" 
        @toggle-sidebar="mobileSidebarOpen = !mobileSidebarOpen" 
      />
      
      <main class="dashboard-scroll-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-layout-root {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--color-bg);
}

.dashboard-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.dashboard-scroll-content {
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
}
</style>
