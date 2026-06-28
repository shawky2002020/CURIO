<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductStore } from '../../../stores/product.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';
import { useToastStore } from '../../../stores/toast.store.js';
import { useWishlistStore } from '../../../stores/wishlist.store.js';
import { reviewApi } from '../../../api/product.api.js';
import type { Review } from '../../../types/product.types.js';
import StarRating from '../components/StarRating.vue';
import WishlistButton from '../../wishlist/components/WishlistButton.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import { ArrowLeft, Package, Star } from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const authStore = useAuthStore();
const toastStore = useToastStore();
const wishlistStore = useWishlistStore();

const reviews = ref<Review[]>([]);
const reviewsLoading = ref(false);
const newRating = ref(5);
const newComment = ref('');
const submitting = ref(false);
const activeImageIdx = ref(0);

const product = computed(() => productStore.currentProduct);
const isInStock = computed(() => (product.value?.stock ?? 0) > 0);
const hasReviewed = computed(() =>
  reviews.value.some((r: any) => r.userId?._id === authStore.user?.id)
);

const allImages = computed(() => {
  if (!product.value) return [];
  return product.value.images.length > 0
    ? product.value.images
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];
});

onMounted(async () => {
  const id = route.params.id as string;
  await productStore.fetchProduct(id);
  await fetchReviews(id);
  if (authStore.isAuthenticated) wishlistStore.fetchWishlist().catch(() => {});
});

const fetchReviews = async (productId: string) => {
  reviewsLoading.value = true;
  try {
    const response = await reviewApi.getByProduct(productId);
    if (response.success && response.data) reviews.value = response.data;
  } catch {
    // non-critical
  } finally {
    reviewsLoading.value = false;
  }
};

const submitReview = async () => {
  if (!product.value) return;
  submitting.value = true;
  try {
    const response = await reviewApi.create(product.value._id, {
      rating: newRating.value,
      comment: newComment.value,
    });
    if (response.success && response.data) {
      reviews.value.unshift(response.data);
      toastStore.success('Review submitted successfully!');
      newComment.value = '';
      newRating.value = 5;
      // Refresh product to get updated avg rating
      await productStore.fetchProduct(product.value._id);
    }
  } catch (err: any) {
    toastStore.error(err.response?.data?.message || 'Failed to submit review.');
  } finally {
    submitting.value = false;
  }
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
</script>

<template>
  <div class="product-detail-view">
    <!-- Back Navigation -->
    <button class="back-btn" @click="router.push({ name: 'home' })">
      <ArrowLeft class="back-icon" /> Back to Catalog
    </button>

    <!-- Loading State -->
    <div v-if="productStore.loading" class="detail-loading">
      <div class="skeleton-image motion-shimmer"></div>
      <div class="skeleton-content">
        <div class="skeleton-text motion-shimmer" style="width: 40%; height: 14px;"></div>
        <div class="skeleton-text motion-shimmer" style="width: 70%; height: 36px; margin-top: 8px;"></div>
        <div class="skeleton-text motion-shimmer" style="width: 100%; height: 80px; margin-top: 16px;"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="productStore.error" class="detail-error">
      <Package class="error-icon" />
      <h2>Product Not Found</h2>
      <p>{{ productStore.error }}</p>
      <BaseButton variant="secondary" @click="router.push({ name: 'home' })">Return to Catalog</BaseButton>
    </div>

    <!-- Product Detail Content -->
    <template v-else-if="product">
      <div class="detail-grid">
        <!-- Image Gallery -->
        <div class="gallery-col">
          <div class="main-image-wrapper">
            <img :src="allImages[activeImageIdx]" :alt="product.name" class="main-image" />
            <span class="category-badge">[ {{ product.categoryId?.name }} ]</span>
            <span v-if="!isInStock" class="oos-badge">Out of Stock</span>
            <div class="gallery-wishlist" @click.stop>
              <WishlistButton :productId="product._id" />
            </div>
          </div>
          <!-- Thumbnail strip -->
          <div v-if="allImages.length > 1" class="thumbnail-strip">
            <button
              v-for="(img, idx) in allImages"
              :key="idx"
              :class="['thumb-btn', { 'thumb-btn--active': idx === activeImageIdx }]"
              @click="activeImageIdx = idx"
            >
              <img :src="img" :alt="`View ${idx + 1}`" class="thumb-img" />
            </button>
          </div>
        </div>

        <!-- Product Info -->
        <div class="info-col">
          <span class="product-serial">OBJECT REF // {{ product._id.substring(0, 8).toUpperCase() }}</span>
          <h1 class="product-name">{{ product.name }}</h1>

          <!-- Rating Summary -->
          <div class="rating-row">
            <StarRating :rating="product.averageRating" size="md" />
            <span class="review-count">({{ product.reviewCount }} review{{ product.reviewCount !== 1 ? 's' : '' }})</span>
          </div>

          <p class="product-description">{{ product.description }}</p>

          <div class="price-stock-row">
            <span class="product-price">${{ product.price.toFixed(2) }}</span>
            <span :class="['stock-badge', isInStock ? 'stock-badge--in' : 'stock-badge--out']">
              {{ isInStock ? `${product.stock} in stock` : 'Out of Stock' }}
            </span>
          </div>

          <div class="seller-info">
            <span class="seller-label">Curated by</span>
            <span class="seller-name">{{ product.seller?.fullName || 'Curio Studio' }}</span>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <section class="reviews-section">
        <div class="reviews-header">
          <Star class="reviews-icon" />
          <h2 class="reviews-title">Member Reviews</h2>
        </div>

        <!-- Submit Review Form -->
        <div
          v-if="authStore.isAuthenticated && authStore.user?.role === 'customer' && !hasReviewed"
          class="review-form-card"
        >
          <h3 class="form-title">Share Your Experience</h3>
          <div class="form-rating-row">
            <span class="form-label">Your Rating</span>
            <StarRating :rating="newRating" :interactive="true" size="md" @rate="newRating = $event" />
          </div>
          <textarea
            v-model="newComment"
            class="review-textarea"
            placeholder="Write your honest review..."
            rows="4"
            id="review-comment"
            aria-label="Review comment"
          ></textarea>
          <BaseButton
            variant="primary"
            :disabled="submitting || !newComment.trim()"
            @click="submitReview"
          >
            {{ submitting ? 'Submitting...' : 'Submit Review' }}
          </BaseButton>
        </div>

        <!-- Already reviewed notice -->
        <div v-else-if="hasReviewed" class="already-reviewed">
          You have already reviewed this product.
        </div>

        <!-- Guest notice -->
        <div v-else-if="!authStore.isAuthenticated" class="guest-notice">
          <router-link to="/auth/login" class="sign-in-link">Sign in</router-link> to leave a review.
        </div>

        <!-- Review List -->
        <div v-if="reviewsLoading" class="reviews-loading">Loading reviews...</div>

        <div v-else-if="reviews.length === 0 && !reviewsLoading" class="no-reviews-state">
          No reviews yet. Be the first!
        </div>

        <ul v-else class="reviews-list">
          <li v-for="review in reviews" :key="review._id" class="review-card">
            <div class="review-header">
              <div class="reviewer-info">
                <span class="reviewer-avatar">
                  {{ (review.userId as any)?.fullName?.charAt(0)?.toUpperCase() || '?' }}
                </span>
                <span class="reviewer-name">{{ (review.userId as any)?.fullName || 'Anonymous' }}</span>
              </div>
              <div class="review-meta">
                <StarRating :rating="review.rating" size="sm" />
                <span class="review-date">{{ formatDate(review.createdAt) }}</span>
              </div>
            </div>
            <p class="review-comment">{{ review.comment }}</p>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.product-detail-view {
  width: 100%;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--color-muted);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 32px;
  transition: color var(--duration-fast) var(--ease-out);
}

.back-btn:hover { color: var(--color-accent); }

.back-icon {
  width: 16px;
  height: 16px;
}

/* Loading skeletons */
.detail-loading {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
}

.skeleton-image {
  height: 500px;
  border-radius: var(--radius-lg);
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
}

.skeleton-text {
  border-radius: var(--radius-sm);
}

/* Error */
.detail-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  padding: 80px 40px;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: var(--color-muted);
}

/* Detail grid */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  margin-bottom: 64px;
}

@media (max-width: 768px) {
  .detail-grid { grid-template-columns: 1fr; gap: 32px; }
  .detail-loading { grid-template-columns: 1fr; }
}

/* Gallery */
.gallery-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-image-wrapper {
  position: relative;
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--color-border);
  background-color: var(--color-bg-alt);
}

.main-image {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
}

.category-badge {
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
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  z-index: 2;
}

.oos-badge {
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
  border-radius: 9999px;
  z-index: 2;
  text-transform: uppercase;
}

.gallery-wishlist {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

.thumbnail-strip {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.thumb-btn {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 2px solid var(--color-border);
  cursor: pointer;
  padding: 0;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.thumb-btn--active { border-color: var(--color-accent); }

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Info column */
.info-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 8px;
}

.product-serial {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-muted);
  font-weight: 600;
  letter-spacing: 0.05em;
}

.product-name {
  font-family: var(--font-heading);
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.2;
  margin: 0;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.review-count {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: var(--color-muted);
}

.product-description {
  font-family: var(--font-sans);
  font-size: 1rem;
  color: var(--color-text);
  line-height: 1.7;
  margin: 0;
}

.price-stock-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
  border-top: 2px solid var(--color-border);
  border-bottom: 2px solid var(--color-border);
}

.product-price {
  font-family: var(--font-mono);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-accent);
}

.stock-badge {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 14px;
  border-radius: 9999px;
}

.stock-badge--in {
  background-color: rgba(22, 163, 74, 0.1);
  color: var(--color-success);
}

.stock-badge--out {
  background-color: rgba(229, 72, 77, 0.1);
  color: var(--color-danger);
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-size: 0.875rem;
}

.seller-label { color: var(--color-muted); }

.seller-name {
  font-weight: 700;
  color: var(--color-primary);
}

/* Reviews */
.reviews-section {
  border-top: 2px solid var(--color-border);
  padding-top: 48px;
}

.reviews-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.reviews-icon {
  width: 22px;
  height: 22px;
  color: var(--color-accent-2);
}

.reviews-title {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.review-form-card {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.form-rating-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.form-label {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-primary);
}

.review-textarea {
  width: 100%;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-alt);
  border: 2px solid var(--color-border);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  resize: vertical;
  min-height: 100px;
  box-sizing: border-box;
  transition: border-color var(--duration-base) var(--ease-out);
}

.review-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(15, 61, 94, 0.08);
}

.already-reviewed,
.guest-notice,
.no-reviews-state,
.reviews-loading {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--color-muted);
  padding: 20px;
  text-align: center;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 24px;
}

.sign-in-link {
  color: var(--color-accent);
  font-weight: 700;
  text-decoration: none;
}

.sign-in-link:hover { text-decoration: underline; }

.reviews-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-card {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reviewer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reviewer-name {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-primary);
  font-size: 0.95rem;
}

.review-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.review-date {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-muted);
}

.review-comment {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--color-text);
  line-height: 1.6;
  margin: 0;
}
</style>
