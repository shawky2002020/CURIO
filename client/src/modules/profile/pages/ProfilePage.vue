<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from '../../../stores/user.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';
import BaseLoader from '../../../components/ui/BaseLoader.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';

const userStore = useUserStore();
const authStore = useAuthStore();

onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await userStore.fetchProfile();
    } catch (err) {
      console.error('Could not fetch user profile details', err);
    }
  }
});
</script>

<template>
  <div class="profile-page">
    <h1 class="page-title">My Account</h1>

    <BaseLoader v-if="userStore.loading" />
    <BaseAlert v-else-if="userStore.error" type="error" :message="userStore.error" />

    <div v-else-if="userStore.profile" class="profile-card">
      <div class="profile-header">
        <div class="avatar">
          {{ userStore.profile.fullName.charAt(0).toUpperCase() }}
        </div>
        <div class="meta">
          <h2 class="name">{{ userStore.profile.fullName }}</h2>
          <span :class="['role-badge', userStore.profile.role]">
            {{ userStore.profile.role.toUpperCase() }}
          </span>
        </div>
      </div>

      <div class="profile-details">
        <div class="detail-row">
          <span class="label">Email Address</span>
          <span class="value">
            {{ userStore.profile.email || 'Not Provided' }}
            <span v-if="userStore.profile.emailVerified" class="verified">Verified</span>
            <span v-else class="unverified">Unverified</span>
          </span>
        </div>

        <div class="detail-row">
          <span class="label">Phone Number</span>
          <span class="value">
            {{ userStore.profile.phone || 'Not Provided' }}
            <span v-if="userStore.profile.phoneVerified" class="verified">Verified</span>
            <span v-else-if="userStore.profile.phone" class="unverified">Unverified</span>
          </span>
        </div>

        <div class="detail-row">
          <span class="label">Account Status</span>
          <span class="value capitalize">{{ userStore.profile.status }}</span>
        </div>

        <div class="detail-row">
          <span class="label">Onboarded via</span>
          <span class="value capitalize">{{ userStore.profile.provider }}</span>
        </div>
      </div>

      <div class="footer-actions">
        <router-link to="/profile/edit" class="btn-edit">Edit Profile</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: #f3f4f6;
  margin-bottom: 2rem;
}

.profile-card {
  background-color: #111827;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 2rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 1.5rem;
}

.avatar {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2.25rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.role-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  width: max-content;
}

.customer {
  background-color: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}

.seller {
  background-color: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.admin {
  background-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.value {
  font-size: 1.05rem;
  color: #e5e7eb;
  font-weight: 600;
}

.verified {
  font-size: 0.75rem;
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  margin-left: 0.5rem;
}

.unverified {
  font-size: 0.75rem;
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  margin-left: 0.5rem;
}

.capitalize {
  text-transform: capitalize;
}

.footer-actions {
  margin-top: 2.5rem;
}

.btn-edit {
  display: inline-block;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  text-decoration: none;
  font-weight: 600;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.btn-edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}
</style>
