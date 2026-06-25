<script setup lang="ts">
import { onMounted } from 'vue';
import { useWishlistStore } from '../../../stores/wishlist.store.js';
import BaseLoader from '../../../components/ui/BaseLoader.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';

const wishlistStore = useWishlistStore();

onMounted(async () => {
  try {
    await wishlistStore.fetchWishlist();
  } catch (err) {
    console.error('Could not load wishlist', err);
  }
});

const handleRemove = async (productId: string) => {
  try {
    await wishlistStore.removeFromWishlist(productId);
  } catch (err) {
    console.error(err);
  }
};
</script>

<template>
  <div class="wishlist-page">
    <h1 class="page-title">My Wishlist</h1>

    <BaseLoader v-if="wishlistStore.loading" />
    <BaseAlert v-else-if="wishlistStore.error" type="error" :message="wishlistStore.error" />

    <div v-else class="wishlist-content">
      <div v-if="!wishlistStore.wishlist || wishlistStore.wishlist.items.length === 0" class="empty-state">
        <p class="empty-text">Your wishlist is empty. Explore products to add items here!</p>
      </div>

      <div v-else class="wishlist-grid">
        <!-- Mock Product cards. In production, details will be fetched from Member 2's Product Catalog module -->
        <div v-for="item in wishlistStore.wishlist.items" :key="item.productId" class="product-card">
          <div class="product-info">
            <h3 class="product-title">Product ID: {{ item.productId }}</h3>
            <p class="added-date">Added on: {{ new Date(item.addedAt).toLocaleDateString() }}</p>
            <p class="integration-note">Note: Details will be resolved via Product Catalog module (Member 2)</p>
          </div>
          <button @click="handleRemove(item.productId)" class="btn-remove">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wishlist-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: #f3f4f6;
  margin-bottom: 2rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: #111827;
  border-radius: 1rem;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.empty-text {
  color: #9ca3af;
  font-size: 1.1rem;
}

.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background-color: #111827;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
}

.product-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0 0 0.5rem 0;
  word-break: break-all;
}

.added-date {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
}

.integration-note {
  font-size: 0.75rem;
  color: #818cf8;
  background-color: rgba(99, 102, 241, 0.1);
  padding: 0.5rem;
  border-radius: 0.375rem;
  margin: 0;
}

.btn-remove {
  width: 100%;
  padding: 0.625rem;
  background-color: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}
</style>
