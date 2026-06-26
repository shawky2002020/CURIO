<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useWishlistStore } from '../../../stores/wishlist.store.js';
import WishlistEmptyState from '../components/WishlistEmptyState.vue';
import BaseLoader from '../../../components/ui/BaseLoader.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';

const wishlistStore = useWishlistStore();
const removingId = ref<string | null>(null);

// Load wishlist on mount
onMounted(async () => {
  try {
    await wishlistStore.fetchWishlist();
  } catch (err) {
    console.error('Failed to fetch user wishlist details', err);
  }
});

// Mock resolver mapping stored productIds to rich product details (mocking Product Catalog Member 2 integration)
const resolveProductDetails = (productId: string) => {
  const catalog: Record<string, { name: string; price: number; image: string; category: string }> = {
    '60d5ecb863a6c22c5c8b4999': {
      name: 'Signature Chronograph Leather Watch',
      price: 249.00,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80',
      category: 'Chronometry',
    },
    '60d5ecb863a6c22c5c8b4998': {
      name: 'Premium Leather Overnight Duffle',
      price: 189.00,
      image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=300&q=80',
      category: 'Leather Goods',
    },
    'default': {
      name: `Premium Curation Item (${productId.substring(0, 8)})`,
      price: 99.99,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80',
      category: 'Exhibition',
    }
  };

  return catalog[productId] || {
    ...catalog['default'],
    name: `Premium Curation Item (${productId.substring(0, 8)})`
  };
};

const handleRemoveItem = async (productId: string) => {
  removingId.value = productId;
  try {
    await wishlistStore.removeFromWishlist(productId);
  } catch (err) {
    console.error(err);
  } finally {
    removingId.value = null;
  }
};
</script>

<template>
  <div class="wishlist-view">
    <header class="page-header">
      <span class="page-eyebrow">PORTAL WISHLIST ARCHIVE</span>
      <h1 class="page-title">Your Curation</h1>
      <p class="page-subtitle">Save items you love here to easily track, acquire, or share them later.</p>
    </header>

    <!-- 1. Loading State -->
    <BaseLoader v-if="wishlistStore.loading && !removingId" text="Retrieving archived curations..." />
    
    <!-- 2. Error State -->
    <BaseAlert v-else-if="wishlistStore.error" type="error" :message="wishlistStore.error" />

    <!-- 3. Success State -->
    <div v-else class="wishlist-container motion-scale-in">
      <!-- Empty State -->
      <WishlistEmptyState v-if="!wishlistStore.wishlist || wishlistStore.wishlist.items.length === 0" />

      <!-- Active Wishlist Grid -->
      <div v-else class="wishlist-grid-layout">
        <div
          v-for="item in wishlistStore.wishlist.items"
          :key="item.productId"
          class="wishlist-item-card"
        >
          <!-- Product image block -->
          <div class="product-image-wrapper">
            <img
              :src="resolveProductDetails(item.productId).image"
              :alt="resolveProductDetails(item.productId).name"
              class="product-image"
              loading="lazy"
            />
            <span class="product-category-tag">
              [ {{ resolveProductDetails(item.productId).category }} ]
            </span>
          </div>

          <!-- Product Details Block -->
          <div class="product-details">
            <div class="meta-row">
              <span class="product-serial">CATALOG REF // {{ item.productId.substring(0, 10).toUpperCase() }}</span>
              <h3 class="product-title">
                {{ resolveProductDetails(item.productId).name }}
              </h3>
              <p class="product-price">
                ${{ resolveProductDetails(item.productId).price.toFixed(2) }}
              </p>
            </div>
            
            <!-- Actions (Add to Cart placeholder, and Remove CTA) -->
            <div class="product-card-actions">
              <BaseButton variant="primary" size="sm" class="btn-cart">
                Acquire
              </BaseButton>
              
              <BaseButton
                variant="ghost"
                size="sm"
                :loading="removingId === item.productId"
                @click="handleRemoveItem(item.productId)"
                class="btn-remove"
              >
                Release
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wishlist-view {
  width: 100%;
}

.page-header {
  margin-bottom: 40px;
  text-align: left;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 24px;
}

.page-eyebrow {
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: var(--color-accent);
  display: block;
  margin-bottom: 6px;
}

.page-title {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-family: var(--font-sans);
  font-size: 1rem;
  color: var(--color-muted);
  margin: 0;
}

.wishlist-grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 32px;
}

/* Playful Curation Card */
.wishlist-item-card {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: all var(--duration-base) var(--ease-spring);
  box-sizing: border-box;
}

.wishlist-item-card:hover {
  transform: translateY(-6px) scale(1.01);
  border-color: var(--color-accent);
  box-shadow: 0 20px 48px rgba(16, 16, 24, 0.08);
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 85%; /* Slightly taller aspect ratio */
  background-color: var(--color-bg-alt);
  overflow: hidden;
  border-bottom: 2px solid var(--color-border);
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all var(--duration-slow) var(--ease-spring);
}

.wishlist-item-card:hover .product-image {
  transform: scale(1.05);
}

.product-category-tag {
  position: absolute;
  top: 16px;
  left: 16px;
  background-color: var(--color-surface);
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 4px 12px;
  border-radius: 99px;
  border: 1px solid var(--color-border);
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  flex-grow: 1;
  text-align: left;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.product-serial {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  font-weight: 600;
}

.product-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--color-primary);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.5em;
}

.product-price {
  margin: 8px 0 0 0;
  font-family: var(--font-mono);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-accent);
}

.product-card-actions {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 2px solid var(--color-bg-alt);
}

.btn-cart {
  width: 100%;
}

.btn-remove {
  width: 100%;
  color: var(--color-muted) !important;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-remove:hover {
  color: var(--color-danger) !important;
  background-color: rgba(229, 72, 77, 0.06) !important;
}
</style>
