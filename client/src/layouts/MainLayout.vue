<script setup lang="ts">
import { useAuthStore } from '../stores/auth.store.js';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'login' });
};
</script>

<template>
  <div class="main-layout">
    <header class="header">
      <div class="header-container">
        <router-link to="/" class="logo">ShopPremium</router-link>
        
        <nav class="nav">
          <router-link to="/" class="nav-link">Home</router-link>
          <template v-if="authStore.isAuthenticated">
            <router-link to="/wishlist" class="nav-link">Wishlist</router-link>
            <router-link to="/profile" class="nav-link">Profile</router-link>
            <button @click="handleLogout" class="btn-logout">Logout</button>
          </template>
          <template v-else>
            <router-link to="/auth/login" class="nav-link btn-login">Login</router-link>
          </template>
        </nav>
      </div>
    </header>

    <main class="content">
      <router-view />
    </main>

    <footer class="footer">
      <p>&copy; 2026 ShopPremium. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #0b0f19;
  color: #f3f4f6;
  font-family: 'Inter', sans-serif;
}

.header {
  background-color: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-decoration: none;
}

.nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: #9ca3af;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-link:hover, .router-link-active {
  color: #f3f4f6;
}

.btn-logout {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f3f4f6;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.btn-login {
  background: linear-gradient(to right, #4f46e5, #7c3aed);
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.375rem;
  transition: opacity 0.2s ease;
}

.btn-login:hover {
  opacity: 0.9;
}

.content {
  flex-grow: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
}

.footer {
  text-align: center;
  padding: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: #4b5563;
  font-size: 0.875rem;
}
</style>
