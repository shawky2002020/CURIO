<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useUserStore } from '../../../stores/user.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';
import { useRouter } from 'vue-router';
import UserAvatar from '../../../components/shared/UserAvatar.vue';
import BaseLoader from '../../../components/ui/BaseLoader.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';

const userStore = useUserStore();
const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await userStore.fetchProfile();
    } catch (err) {
      console.error('Failed to load profile dashboard', err);
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
</style>
