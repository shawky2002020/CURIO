<script setup lang="ts">
/**
 * SellerDashboardPage Component
 * Premium placeholder for the Curio Seller product and inventory studio.
 */
import { useAuthStore } from '../../../stores/auth.store.js';
import BaseButton from '../../../components/ui/BaseButton.vue';

const authStore = useAuthStore();
</script>

<template>
  <div class="seller-dashboard-container">
    <header class="dashboard-header">
      <div class="welcome-section">
        <h1>Seller Studio</h1>
        <p class="subtitle">Welcome back, {{ authStore.user?.fullName || 'Seller Partner' }}</p>
      </div>
      <div class="studio-badge">
        Active Studio
      </div>
    </header>

    <div class="dashboard-grid">
      <div class="dashboard-card sales-card">
        <h3>Studio Performance</h3>
        <div class="stat-row">
          <span class="stat-label">Total Listings</span>
          <span class="stat-value">12</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Views This Month</span>
          <span class="stat-value">340</span>
        </div>
      </div>

      <div class="dashboard-card management-card">
        <h3>Studio Catalog</h3>
        <p>List new items, track your inventory stock counts, or update pricing details directly.</p>
        <div class="action-buttons">
          <router-link to="/admin/products">
            <BaseButton variant="primary">Manage Inventory</BaseButton>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seller-dashboard-container {
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

.studio-badge {
  padding: 8px 16px;
  border-radius: var(--radius-full);
  background-color: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid rgba(99, 102, 241, 0.2);
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

.management-card p {
  color: var(--color-text-light);
  margin-bottom: 24px;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style>
