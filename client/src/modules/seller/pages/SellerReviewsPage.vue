<script setup lang="ts">

import { ref, onMounted } from 'vue';
import sellerApi, { type SellerReviewItem } from '../../../api/seller.api.js';
import { useToastStore } from '../../../stores/toast.store.js';
import StarRating from '../../catalog/components/StarRating.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BasePagination from '../../../components/ui/BasePagination.vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import {
  MessageSquare,
  Package,
  Calendar,
  User,
  AlertTriangle,
  RefreshCw,
  Send,
  Edit3,
} from '@lucide/vue';

const toastStore = useToastStore();

const loading = ref(true);
const error = ref<string | null>(null);

const reviews = ref<SellerReviewItem[]>([]);
const total = ref(0);
const pages = ref(1);
const currentPage = ref(1);
const limit = ref(10);

// Reply Modal state
const showReplyModal = ref(false);
const activeReview = ref<SellerReviewItem | null>(null);
const replyText = ref('');
const submittingReply = ref(false);

const fetchReviews = async (page = 1) => {
  loading.value = true;
  error.value = null;
  try {
    const response = await sellerApi.fetchReviews({ page, limit: limit.value });
    if (response.success && response.data) {
      reviews.value = response.data.reviews;
      total.value = response.data.total;
      pages.value = response.data.pages;
      currentPage.value = response.data.page;
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to retrieve reviews history.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchReviews(1);
});

const handlePageChange = (page: number) => {
  fetchReviews(page);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const openReplyModal = (review: SellerReviewItem) => {
  activeReview.value = review;
  replyText.value = review.sellerReply || '';
  showReplyModal.value = true;
};

const closeReplyModal = () => {
  showReplyModal.value = false;
  activeReview.value = null;
  replyText.value = '';
};

const submitReply = async () => {
  if (!activeReview.value) return;
  if (!replyText.value.trim()) {
    toastStore.error('Reply text cannot be empty.');
    return;
  }

  submittingReply.value = true;
  try {
    const response = await sellerApi.replyToReview(activeReview.value._id, replyText.value.trim());
    if (response.success && response.data) {
      toastStore.success('Review reply posted successfully!');
      
      // Update local state
      const index = reviews.value.findIndex(r => r._id === activeReview.value?._id);
      if (index !== -1) {
        reviews.value[index] = response.data;
      }
      
      closeReplyModal();
    }
  } catch (err: any) {
    toastStore.error(err.response?.data?.message || 'Failed to submit review reply.');
  } finally {
    submittingReply.value = false;
  }
};
</script>

<template>
  <div class="seller-reviews-page">
    <!-- Header -->
    <header class="page-header">
      <div class="title-wrap">
        <h1 class="page-title">Collector Reviews</h1>
        <p class="page-subtitle">View and respond to feedback left on your studio collection.</p>
      </div>

      <button class="sync-btn" @click="fetchReviews(currentPage)" :disabled="loading">
        <RefreshCw :class="['btn-icon', { 'spin-animation': loading }]" /> Refresh Reviews
      </button>
    </header>

    <!-- Error state -->
    <div v-if="error" class="error-banner">
      <AlertTriangle class="error-icon" />
      <h3>Failed to load reviews</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchReviews(1)">Retry</button>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading collector reviews...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="reviews.length === 0" class="empty-state">
      <MessageSquare class="empty-icon" />
      <h3>No reviews yet</h3>
      <p>Reviews left by customers on your active collections will appear here.</p>
    </div>

    <!-- Reviews Grid -->
    <template v-else>
      <div class="reviews-feed">
        <article v-for="review in reviews" :key="review._id" class="review-card">
          <!-- Card Header: Product & Customer info -->
          <header class="review-card-header">
            <div class="product-info-wrap">
              <img 
                v-if="review.productId?.images?.[0]" 
                :src="review.productId.images[0]" 
                class="prod-thumbnail" 
                alt="Product thumbnail" 
              />
              <div v-else class="prod-thumbnail-placeholder">
                <Package class="placeholder-icon" />
              </div>
              <div class="prod-details">
                <span class="prod-label">Product Reviewed</span>
                <h3 class="prod-title">{{ review.productId?.name || 'Deleted Product' }}</h3>
              </div>
            </div>

            <div class="reviewer-meta">
              <div class="user-badge">
                <User class="user-icon" />
                <span class="username">{{ review.userId?.fullName || 'Collector' }}</span>
              </div>
              <div class="date-badge">
                <Calendar class="calendar-icon" />
                <span>{{ formatDate(review.createdAt) }}</span>
              </div>
            </div>
          </header>

          <!-- Rating & Comment Section -->
          <section class="review-comment-section">
            <div class="rating-row">
              <StarRating :rating="review.rating" size="sm" />
              <span class="rating-text">{{ review.rating }}.0 Stars</span>
            </div>
            <p class="comment-text">"{{ review.comment }}"</p>
          </section>

          <!-- Reply Section -->
          <footer class="review-reply-footer">
            <div v-if="review.sellerReply" class="reply-bubble">
              <div class="reply-header">
                <span class="reply-owner-label">Your Response</span>
                <button class="edit-reply-btn" @click="openReplyModal(review)" title="Edit reply">
                  <Edit3 class="edit-icon" /> Edit
                </button>
              </div>
              <p class="reply-text">{{ review.sellerReply }}</p>
            </div>
            <div v-else class="no-reply-row">
              <span class="no-reply-text">No response recorded for this feedback.</span>
              <BaseButton type="button" variant="secondary" size="sm" @click="openReplyModal(review)">
                <MessageSquare class="btn-icon-inside" /> Respond to Collector
              </BaseButton>
            </div>
          </footer>
        </article>
      </div>

      <!-- Pagination -->
      <div class="pagination-container">
        <BasePagination 
          :currentPage="currentPage" 
          :totalPages="pages" 
          @page-change="handlePageChange" 
        />
      </div>
    </template>

    <!-- MODAL: Reply to Review -->
    <BaseModal 
      :show="showReplyModal" 
      :title="activeReview?.sellerReply ? 'Edit response to collector' : 'Submit response to collector'" 
      size="md" 
      @close="closeReplyModal"
    >
      <div v-if="activeReview" class="reply-form-wrap">
        <div class="collector-summary-card">
          <p class="summary-comment"><strong>{{ activeReview.userId?.fullName }} wrote:</strong></p>
          <blockquote class="summary-quote">"{{ activeReview.comment }}"</blockquote>
        </div>

        <form @submit.prevent="submitReply" class="reply-form">
          <div class="textarea-group">
            <label for="seller-reply-input" class="input-label">Your Response</label>
            <textarea
              id="seller-reply-input"
              v-model="replyText"
              rows="5"
              placeholder="Thank the collector, address their feedback, or explain delivery nuances..."
              class="textarea-control"
              required
            ></textarea>
          </div>

          <div class="modal-form-actions">
            <BaseButton 
              type="button" 
              variant="secondary" 
              @click="closeReplyModal" 
              :disabled="submittingReply"
            >
              Cancel
            </BaseButton>
            <BaseButton 
              type="submit" 
              :loading="submittingReply"
            >
              <Send class="btn-send-icon" /> Send Response
            </BaseButton>
          </div>
        </form>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.seller-reviews-page {
  padding: 32px;
  max-width: 960px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 20px;
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

.sync-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sync-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.spin-animation {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.error-banner {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  padding: 32px;
  border-radius: var(--radius-lg);
  text-align: center;
  margin-bottom: 24px;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: var(--color-danger);
  margin-bottom: 12px;
}

.retry-btn {
  background-color: var(--color-danger);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  margin-top: 12px;
  cursor: pointer;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--color-muted);
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: var(--color-text-h);
  margin: 0 0 8px 0;
}

.empty-state p {
  color: var(--color-muted);
  margin: 0;
}

.reviews-feed {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 28px;
}

.review-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.01);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.product-info-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.prod-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.prod-thumbnail-placeholder {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.placeholder-icon {
  width: 20px;
  height: 20px;
  color: var(--color-muted);
}

.prod-details {
  text-align: left;
}

.prod-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  font-weight: 600;
}

.prod-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-h);
  margin: 2px 0 0 0;
}

.reviewer-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.user-badge,
.date-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.username {
  font-weight: 600;
  color: var(--color-text-h);
}

.user-icon,
.calendar-icon {
  width: 14px;
  height: 14px;
}

.review-comment-section {
  text-align: left;
  border-top: 1px dashed var(--color-border);
  border-bottom: 1px dashed var(--color-border);
  padding: 16px 0;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rating-text {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-primary);
}

.comment-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--color-text-h);
  margin: 0;
  font-style: italic;
}

.review-reply-footer {
  text-align: left;
}

.reply-bubble {
  background-color: var(--color-bg-alt);
  border-left: 3px solid var(--color-primary);
  padding: 16px;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.reply-owner-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.edit-reply-btn {
  background: none;
  border: none;
  color: var(--color-accent);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
}

.edit-reply-btn:hover {
  background-color: rgba(99, 102, 241, 0.05);
}

.edit-icon {
  width: 12px;
  height: 12px;
}

.reply-text {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-text);
  margin: 0;
}

.no-reply-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.no-reply-text {
  font-size: 0.85rem;
  color: var(--color-muted);
}

.btn-icon-inside {
  width: 14px;
  height: 14px;
  margin-right: 6px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* Reply Form inside Modal */
.reply-form-wrap {
  text-align: left;
}

.collector-summary-card {
  background-color: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 20px;
}

.summary-comment {
  font-size: 0.85rem;
  color: var(--color-muted);
  margin: 0 0 6px 0;
}

.summary-quote {
  font-size: 0.95rem;
  color: var(--color-text-h);
  font-style: italic;
  margin: 0;
  line-height: 1.4;
}

.reply-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.textarea-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.textarea-control {
  padding: 12px;
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-h);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  resize: vertical;
}

.textarea-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(15, 61, 94, 0.1);
}

.modal-form-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
}

.btn-send-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
}
</style>
