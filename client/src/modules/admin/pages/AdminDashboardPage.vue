<script setup lang="ts">
/**
 * AdminDashboardPage Component
 * Premium placeholder for the Curio Administrative management console.
 */
import { ref } from 'vue';
import { useAuthStore } from '../../../stores/auth.store.js';
import BaseButton from '../../../components/ui/BaseButton.vue';

const authStore = useAuthStore();
const systemStatus = ref('healthy');
</script>

<template>
  <div class="admin-dashboard-container">
    <header class="dashboard-header">
      <div class="welcome-section">
        <h1>Admin Control Panel</h1>
        <p class="subtitle">Welcome back, {{ authStore.user?.fullName || 'Administrator' }}</p>
      </div>
      <div class="status-badge" :class="systemStatus">
        <span class="indicator"></span> System: Healthy
      </div>
    </header>

    <div class="dashboard-grid">
      <div class="dashboard-card status-card">
        <h3>Quick Statistics</h3>
        <div class="stat-row">
          <span class="stat-label">Active Users</span>
          <span class="stat-value">1,248</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Pending Reviews</span>
          <span class="stat-value">4</span>
        </div>
      </div>

      <div class="dashboard-card action-card">
        <h3>Administrative Tools</h3>
        <p>Manage system categories, user permission hierarchies, or generate platform analytics reports.</p>
        <div class="action-buttons">
          <router-link to="/admin/categories">
            <BaseButton variant="primary">Manage Categories</BaseButton>
          </router-link>
          <router-link to="/admin/products">
            <BaseButton variant="secondary">Review Products</BaseButton>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-dashboard-container {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 24px;
}

.welcome-section h1 {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.subtitle {
  color: var(--color-text-light);
  margin: 0;
  font-size: 1.1rem;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #10b981;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.dashboard-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-soft);
}

.dashboard-card h3 {
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  color: var(--color-text);
  font-weight: 600;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px dashed var(--color-border);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  color: var(--color-text-light);
}

.stat-value {
  font-weight: 700;
  color: var(--color-text);
}

.action-card p {
  color: var(--color-text-light);
  margin-bottom: 24px;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style>
