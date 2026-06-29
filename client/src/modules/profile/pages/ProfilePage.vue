<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '../../../stores/user.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';
import { useRouter } from 'vue-router';
import UserAvatar from '../../../components/shared/UserAvatar.vue';
import BaseLoader from '../../../components/ui/BaseLoader.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import { cartApi } from '../../../api/cart.api.js';
import type { OrderData } from '../../../api/cart.api.js';

const userStore = useUserStore();
const authStore = useAuthStore();
const router = useRouter();

const orders = ref<OrderData[]>([]);
const ordersLoading = ref(false);
const ordersError = ref<string | null>(null);

onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await userStore.fetchProfile();
      
      // Load user order history
      ordersLoading.value = true;
      const response = await cartApi.getMyOrders();
      if (response.success && response.data) {
        orders.value = response.data;
      }
    } catch (err: any) {
      console.error('Failed to load profile dashboard', err);
      ordersError.value = err.response?.data?.message || 'Failed to load order history.';
    } finally {
      ordersLoading.value = false;
    }
  }
});

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'login' });
};

// Compute user initials fallback for avatar
const userInitials = computed(() => {
  if (!userStore.profile?.fullName) return 'CU';
  return userStore.profile.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
});

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
</script>

<template>
  <div class="profile-dashboard">
    <header class="dashboard-header">
      <span class="dashboard-eyebrow">PORTAL MEMBER REGISTRY</span>
      <h1 class="dashboard-title">Member Hub</h1>
      <p class="dashboard-subtitle">Review your secure account settings, membership status, and archive metrics.</p>
    </header>

    <BaseLoader v-if="userStore.loading" text="Retrieving registry credentials..." />
    <BaseAlert v-else-if="userStore.error" type="error" :message="userStore.error" />

    <div v-else-if="userStore.profile" class="dashboard-grid motion-scale-in">
      <!-- 1. Profile Summary Card -->
      <section class="summary-card" aria-label="Profile Summary">
        <div class="avatar-container">
          <div class="avatar-frame">
            <UserAvatar
              v-if="userStore.profile.avatarUrl"
              :avatarUrl="userStore.profile.avatarUrl"
              :fullName="userStore.profile.fullName"
              size="lg"
            />
            <div v-else class="avatar-fallback">
              {{ userInitials }}
            </div>
          </div>
        </div>
        
        <div class="meta-container">
          <span class="member-serial">MEMBER ID // {{ userStore.profile.id ? userStore.profile.id.substring(0, 8).toUpperCase() : 'MEMBER' }}</span>
          <h2 class="user-name">{{ userStore.profile.fullName }}</h2>
          <div class="badges-row">
            <span :class="['badge', `badge-${userStore.profile.role}`]">
              {{ userStore.profile.role === 'customer' ? 'Collector' : userStore.profile.role }}
            </span>
            <span :class="['badge', `badge-${userStore.profile.status}`]">
              {{ userStore.profile.status }}
            </span>
          </div>
        </div>
      </section>

      <!-- 2. Detailed Profile Fields -->
      <section class="details-section" aria-label="Account Information">
        <h3 class="section-heading">Account Information</h3>
        
        <div class="details-grid">
          <!-- Email Field -->
          <div class="detail-card">
            <span class="field-label">Registry Email</span>
            <div class="field-value-row">
              <span class="field-value">{{ userStore.profile.email || 'Not provided' }}</span>
              <span
                v-if="userStore.profile.email"
                :class="['status-pill', userStore.profile.emailVerified ? 'pill-verified' : 'pill-unverified']"
              >
                {{ userStore.profile.emailVerified ? 'Verified' : 'Unverified' }}
              </span>
            </div>
          </div>

          <!-- Phone Field -->
          <div class="detail-card">
            <span class="field-label">Secure Phone</span>
            <div class="field-value-row">
              <span class="field-value">{{ userStore.profile.phone || 'Not provided' }}</span>
              <span
                v-if="userStore.profile.phone"
                :class="['status-pill', userStore.profile.phoneVerified ? 'pill-verified' : 'pill-unverified']"
              >
                {{ userStore.profile.phoneVerified ? 'Verified' : 'Unverified' }}
              </span>
            </div>
          </div>

          <!-- Login Details -->
          <div class="detail-card">
            <span class="field-label">Login Method</span>
            <span class="field-value capitalize">{{ userStore.profile.provider }} Authentication</span>
          </div>

          <!-- Last Login -->
          <div v-if="userStore.profile.lastLoginAt" class="detail-card">
            <span class="field-label">Last Session Handshake</span>
            <span class="field-value monospace-val">
              {{ new Date(userStore.profile.lastLoginAt).toLocaleString() }}
            </span>
          </div>
        </div>

        <!-- Dashboard Controls -->
        <footer class="details-footer">
          <router-link to="/profile/edit" class="edit-link">
            <BaseButton variant="primary">Edit Profile</BaseButton>
          </router-link>
          
          <BaseButton variant="secondary" @click="handleLogout" class="btn-dashboard-logout">
            Log Out
          </BaseButton>
        </footer>
      </section>

      <!-- 3. Order History Registry -->
      <section class="orders-section" aria-label="Order History">
        <h3 class="section-heading">Curation Order History</h3>
        
        <div v-if="ordersLoading" class="orders-loading-state">
          <div class="small-spinner"></div>
          <span>Retrieving archived curations...</span>
        </div>
        <div v-else-if="ordersError" class="orders-error-state">
          {{ ordersError }}
        </div>
        <div v-else-if="orders.length === 0" class="empty-orders-card">
          <p class="empty-orders-text">No curations logged on this account yet.</p>
          <router-link to="/">
            <BaseButton variant="secondary" size="sm">Explore Catalog</BaseButton>
          </router-link>
        </div>
        <div v-else class="orders-table-wrapper">
          <table class="orders-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Established</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order._id">
                <td class="order-ref font-mono">{{ order._id.substring(0, 8).toUpperCase() }}...</td>
                <td>{{ formatDate(order.createdAt) }}</td>
                <td class="order-total font-mono">${{ order.totals.total.toFixed(2) }}</td>
                <td>
                  <span :class="['status-pill', `pill-${order.status}`]">
                    {{ order.status }}
                  </span>
                </td>
                <td>
                  <router-link :to="`/orders/${order._id}`" class="view-order-link">
                    View Registry
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.profile-dashboard {
  max-width: 850px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 40px;
  text-align: left;
}

.dashboard-eyebrow {
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: var(--color-accent);
  display: block;
  margin-bottom: 6px;
}

.dashboard-title {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.dashboard-subtitle {
  font-family: var(--font-sans);
  font-size: 1rem;
  color: var(--color-muted);
  margin: 0;
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Summary Card Style */
.summary-card {
  display: flex;
  align-items: center;
  gap: 32px;
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-card);
  box-sizing: border-box;
}

.avatar-container {
  flex-shrink: 0;
}

.avatar-frame {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 4px solid var(--color-accent-2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--color-bg-alt);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.avatar-fallback {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-primary);
}

.meta-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.member-serial {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  font-weight: 600;
}

.user-name {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 2.1rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.badges-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.badge {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 16px;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
}

/* Playful Badges */
.badge-customer {
  background-color: rgba(255, 107, 53, 0.08);
  color: var(--color-accent);
  border-color: rgba(255, 107, 53, 0.15);
}
.badge-seller {
  background-color: rgba(255, 190, 11, 0.1);
  color: #b27b00;
  border-color: rgba(255, 190, 11, 0.2);
}
.badge-admin {
  background-color: rgba(229, 72, 77, 0.08);
  color: var(--color-danger);
  border-color: rgba(229, 72, 77, 0.15);
}
.badge-active {
  background-color: rgba(61, 220, 151, 0.1);
  color: #1b8e5c;
  border-color: rgba(61, 220, 151, 0.2);
}
.badge-blocked {
  background-color: rgba(229, 72, 77, 0.1);
  color: var(--color-danger);
}

/* Details Section Style */
.details-section {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 40px;
  box-shadow: var(--shadow-card);
  box-sizing: border-box;
  text-align: left;
}

.section-heading {
  margin: 0 0 32px 0;
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-bg-alt);
  padding-bottom: 12px;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.detail-card {
  background-color: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-value {
  font-family: var(--font-sans);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
}

.monospace-val {
  font-family: var(--font-mono) !important;
  font-size: 0.95rem;
}

.field-value-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.status-pill {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 99px;
  letter-spacing: 0.05em;
  border: 1px solid transparent;
}

.pill-verified {
  background-color: rgba(61, 220, 151, 0.12);
  color: #1b8e5c;
  border-color: rgba(61, 220, 151, 0.2);
}
.pill-unverified {
  background-color: rgba(229, 72, 77, 0.1);
  color: var(--color-danger);
  border-color: rgba(229, 72, 77, 0.15);
}

.capitalize {
  text-transform: capitalize;
}

.details-footer {
  display: flex;
  gap: 16px;
  border-top: 2px solid var(--color-bg-alt);
  padding-top: 32px;
}

.edit-link {
  text-decoration: none;
}

@media (max-width: 640px) {
  .summary-card {
    flex-direction: column;
    text-align: center;
    padding: 24px 16px;
  }
  .meta-container {
    text-align: center;
    align-items: center;
  }
  .details-section {
    padding: 24px 16px;
  }
  .details-footer {
    flex-direction: column;
  }
  .edit-link, .btn-dashboard-logout {
    width: 100%;
  }
}

/* Order History styling */
.orders-section {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 40px;
  box-shadow: var(--shadow-card);
  box-sizing: border-box;
  text-align: left;
}

.orders-loading-state {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-muted);
  font-family: var(--font-sans);
  padding: 24px 0;
}

.small-spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  animation: spin 1s infinite linear;
}

.orders-error-state {
  color: var(--color-danger);
  font-family: var(--font-sans);
  font-weight: 600;
  padding: 16px 0;
}

.empty-orders-card {
  background-color: var(--color-bg-alt);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 40px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-orders-text {
  font-family: var(--font-sans);
  color: var(--color-muted);
  margin: 0;
  font-size: 0.95rem;
}

.orders-table-wrapper {
  overflow-x: auto;
  margin-top: 8px;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-family: var(--font-sans);
  font-size: 0.92rem;
}

.orders-table th {
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  border-bottom: 2px solid var(--color-border);
}

.orders-table td {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-primary);
  font-weight: 500;
}

.orders-table tr:last-child td {
  border-bottom: none;
}

.order-ref {
  font-weight: 700 !important;
  color: var(--color-primary);
}

.order-total {
  font-weight: 700 !important;
  color: var(--color-accent);
}

.font-mono {
  font-family: var(--font-mono) !important;
}

.view-order-link {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 700;
  font-family: var(--font-display);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: color var(--duration-fast) var(--ease-out);
}

.view-order-link:hover {
  color: var(--color-accent-dark, #ff501c);
}

/* Status Pill extensions */
.pill-pending {
  background-color: rgba(107, 114, 128, 0.08);
  color: #6b7280;
  border-color: rgba(107, 114, 128, 0.15);
}

.pill-processing {
  background-color: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.15);
}

.pill-shipped {
  background-color: rgba(245, 158, 11, 0.08);
  color: #d97706;
  border-color: rgba(245, 158, 11, 0.15);
}

.pill-delivered {
  background-color: rgba(16, 185, 129, 0.08);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.15);
}

.pill-cancelled {
  background-color: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.15);
}

@media (max-width: 640px) {
  .orders-section {
    padding: 24px 16px;
  }
}
</style>
