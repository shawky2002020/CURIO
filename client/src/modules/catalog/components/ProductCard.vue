<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import WishlistButton from '../../wishlist/components/WishlistButton.vue';
import StarRating from './StarRating.vue';
import type { Product } from '../../../types/product.types.js';

const props = defineProps<{
  product: Product;
}>();

const router = useRouter();

const primaryImage = computed(() =>
  props.product.images.length > 0
    ? props.product.images[0]
    : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
);

const isInStock = computed(() => props.product.stock > 0);

const handleNavigate = () => {
  router.push({ name: 'product-detail', params: { id: props.product._id } });
};
</script>

<template>
  <article class="product-card motion-scale-in" @click="handleNavigate" role="button" tabindex="0" @keydown.enter="handleNavigate">
    <!-- Product Image & Overlay -->
    <div class="product-image-wrapper">
      <img
        :src="primaryImage"
        :alt="product.name"
        class="product-image"
        loading="lazy"
      />
      <span class="product-category-tag">
        [ {{ product.categoryId?.name || 'Uncategorized' }} ]
      </span>
      <span v-if="!isInStock" class="out-of-stock-badge">Out of Stock</span>

      <!-- Wishlist Button Overlay -->
      <div class="wishlist-btn-overlay" @click.stop>
        <WishlistButton :productId="product._id" />
      </div>
    </div>

    <!-- Product Details -->
    <div class="product-details">
      <div class="meta-row">
        <span class="product-serial">{{ product._id.substring(0, 8).toUpperCase() }}</span>
        <h3 class="product-title">{{ product.name }}</h3>
        <p class="product-description">{{ product.description }}</p>
      </div>

      <div class="card-footer-row">
        <div class="price-rating-col">
          <span class="product-price">${{ product.price.toFixed(2) }}</span>
          <StarRating v-if="product.reviewCount > 0" :rating="product.averageRating" size="sm" />
          <span v-else class="no-reviews">No reviews yet</span>
        </div>
        <button class="btn-acquire" @click.stop="handleNavigate">Discover</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: all var(--duration-base) var(--ease-spring);
  box-sizing: border-box;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-6px) scale(1.01);
  border-color: var(--color-accent);
  box-shadow: 0 20px 48px rgba(16, 16, 24, 0.08);
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 80%;
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

.product-card:hover .product-image {
  transform: scale(1.04);
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
  border-radius: var(--radius-pill, 9999px);
  border: 1px solid var(--color-border);
  z-index: 2;
}

.out-of-stock-badge {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background-color: var(--color-danger);
  color: white;
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 4px 12px;
  border-radius: var(--radius-pill, 9999px);
  z-index: 2;
  text-transform: uppercase;
}

.wishlist-btn-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
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
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.25;
}

.product-description {
  margin: 8px 0 0 0;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: var(--color-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 4.5em;
}

.card-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 16px;
  border-top: 2px solid var(--color-bg-alt);
}

.price-rating-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-price {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-accent);
}

.no-reviews {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--color-muted);
}

.btn-acquire {
  background-color: var(--color-accent);
  color: white;
  border: none;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-spring);
  box-shadow: var(--shadow-button);
  min-width: 90px;
}

.btn-acquire:hover {
  background-color: var(--color-primary);
  transform: translateY(-1px);
}

.btn-acquire:active {
  transform: scale(0.96);
}
</style>
