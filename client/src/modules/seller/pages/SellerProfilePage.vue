<script setup lang="ts">
import { useRouter } from 'vue-router';
import SellerProfileForm from '../components/SellerProfileForm.vue';

const router = useRouter();

const handleCancel = () => {
  router.push('/seller/dashboard');
};

const handleSuccess = () => {
  console.log('[SellerProfilePage] Store profile updated successfully.');
};
</script>

<template>
  <div class="seller-profile-page">
    <!-- Header -->
    <header class="profile-header">
      <div class="header-welcome">
        <h1 class="page-title">Store Profile</h1>
        <p class="page-subtitle">
          Manage your gallery details, branding logos, contact info, and public storefront details.
        </p>
      </div>
    </header>

    <!-- Main Workspace -->
    <div class="profile-content-wrap">
      <SellerProfileForm @success="handleSuccess" @cancel="handleCancel" />
    </div>
  </div>
</template>

<style scoped>
.seller-profile-page {
  padding: 32px;
  max-width: 800px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 20px;
  flex-wrap: wrap;
}

.header-welcome {
  text-align: left;
}

.page-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--color-muted);
  margin: 0;
}

.profile-content-wrap {
  width: 100%;
}
</style>
