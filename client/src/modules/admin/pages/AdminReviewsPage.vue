<script setup lang="ts">
/**
 * AdminReviewsPage
 * Administrative Review Moderation dashboard.
 * Uses BaseTable, BasePagination, and BaseConfirmDialog.
 */
import { ref, onMounted, watch } from 'vue';
import { adminApi, type ReviewRegistryItem } from '../../../api/admin.api.js';
import { useToastStore } from '../../../stores/toast.store.js';
import {
  Search,
  Trash2,
  AlertTriangle,
  EyeOff,
  RotateCcw,
  Star,
  MessageSquareOff,
} from '@lucide/vue';

// UI Base Components
import BaseTable from '../../../components/ui/BaseTable.vue';
import BasePagination from '../../../components/ui/BasePagination.vue';
import BaseConfirmDialog from '../../../components/ui/BaseConfirmDialog.vue';

const toastStore = useToastStore();

const loading = ref(true);
const error = ref<string | null>(null);

const reviews = ref<ReviewRegistryItem[]>([]);
const totalReviews = ref(0);
const totalPages = ref(1);
const currentPage = ref(1);
const limitPerPage = ref(10);

const search = ref('');

// Table Configuration
const tableHeaders = [
  { key: 'product', label: 'Product' },
  { key: 'user', label: 'Reviewer' },
  { key: 'rating', label: 'Rating', align: 'center' as const, width: '120px' },
  { key: 'comment', label: 'Comment' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'createdAt', label: 'Date', width: '140px' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '120px' },
];

// Confirm Dialog State
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');
const confirmDialogVariant = ref<'primary' | 'danger' | 'warning'>('primary');
const confirmDialogLoading = ref(false);
const onConfirmCallback = ref<(() => Promise<void>) | null>(null);

const fetchReviews = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await adminApi.fetchReviews({
      page: currentPage.value,
      limit: limitPerPage.value,
      search: search.value.trim() || undefined,
    });
    if (response.success && response.data) {
      reviews.value = response.data.reviews;
      totalReviews.value = response.data.total;
      totalPages.value = response.data.pages;
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to retrieve reviews.';
  } finally {
    loading.value = false;
  }
};

// Search Watcher
let searchTimeout: any = null;
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchReviews();
  }, 350);
});

onMounted(() => {
  fetchReviews();
});

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchReviews();
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const statusBadgeColor = (status: string): string => {
  return status === 'hidden' ? '#ef4444' : '#10b981';
};

// Confirm overlay orchestrator
const openConfirm = (
  title: string,
  message: string,
  variant: 'primary' | 'danger' | 'warning',
  onConfirm: () => Promise<void>
) => {
  confirmDialogTitle.value = title;
  confirmDialogMessage.value = message;
  confirmDialogVariant.value = variant;
  onConfirmCallback.value = onConfirm;
  showConfirmDialog.value = true;
};

const handleConfirmDialogAction = async () => {
  if (onConfirmCallback.value) {
    confirmDialogLoading.value = true;
    try {
      await onConfirmCallback.value();
      showConfirmDialog.value = false;
    } catch (err) {
      // Handled inside callback
    } finally {
      confirmDialogLoading.value = false;
      onConfirmCallback.value = null;
    }
  }
};

const handleConfirmDialogCancel = () => {
  onConfirmCallback.value = null;
};

// Moderation Actions
const handleToggleHideReview = (review: ReviewRegistryItem) => {
  const isHidden = review.status === 'hidden';
  const newStatus = isHidden ? 'active' : 'hidden';
  const actionLabel = isHidden ? 'Restore' : 'Hide';
  const variant = isHidden ? 'primary' : 'warning';
  
  openConfirm(
    `${actionLabel} Review`,
    `Are you sure you want to ${actionLabel.toLowerCase()} this review? Hidden reviews are excluded from product rating statistics and catalog detail pages.`,
    variant,
    async () => {
      try {
        const response = await adminApi.updateReview(review._id, { status: newStatus });
        if (response.success) {
          toastStore.success(`Successfully set review status to: ${newStatus}`);
          fetchReviews();
        }
      } catch (err: any) {
        toastStore.error(err?.response?.data?.message || 'Failed to update review status.');
        throw err;
      }
    }
  );
};

const handleDeleteReview = (review: ReviewRegistryItem) => {
  openConfirm(
    'Delete Review Permanently',
    `Are you sure you want to permanently delete this review by ${review.user.fullName}? This action cannot be undone.`,
    'danger',
    async () => {
      try {
        const response = await adminApi.deleteReview(review._id);
        if (response.success) {
          toastStore.success('Review permanently deleted.');
          fetchReviews();
        }
      } catch (err: any) {
        toastStore.error(err?.response?.data?.message || 'Failed to delete review.');
        throw err;
      }
    }
  );
};

const clearSearch = () => {
  search.value = '';
};
</script>

<template>
  <div class="admin-reviews-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">Review Moderation</h1>
        <p class="page-subtitle">Inspect customer reviews, hide inappropriate feedback, or remove spam permanently.</p>
      </div>
    </header>

    <!-- Toolbar Filters -->
    <section class="controls-toolbar">
      <div class="search-input-wrap">
        <Search class="search-icon" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by comments, products, or reviewers..."
          class="search-input-box"
        />
      </div>
    </section>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <AlertTriangle class="error-icon" />
      <h3>Failed to load reviews list</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchReviews">Retry</button>
    </div>

    <!-- Reviews Table -->
    <template v-else>
      <BaseTable
        :headers="tableHeaders"
        :items="reviews"
        :loading="loading"
        emptyText="No Product Reviews Found"
      >
        <!-- Cell: Product -->
        <template #cell(product)="{ item }">
          <div class="product-info-cell">
            <span class="product-name">{{ item.product?.name }}</span>
            <span class="product-id-sub">ID: {{ item.product?._id.substring(0, 8) }}...</span>
          </div>
        </template>

        <!-- Cell: User/Reviewer -->
        <template #cell(user)="{ item }">
          <div class="user-info-cell">
            <span class="user-name">{{ item.user?.fullName }}</span>
            <span class="user-email">{{ item.user?.email }}</span>
          </div>
        </template>

        <!-- Cell: Rating Stars -->
        <template #cell(rating)="{ item }">
          <div class="stars-rating-wrap">
            <Star
              v-for="i in 5"
              :key="i"
              :class="['star-icon', i <= item.rating ? 'star-icon--filled' : 'star-icon--empty']"
            />
          </div>
        </template>

        <!-- Cell: Comment -->
        <template #cell(comment)="{ item }">
          <div class="comment-cell-wrap">
            <span class="comment-text-box" :title="item.comment">{{ item.comment }}</span>
            <div v-if="item.sellerReply" class="admin-reply-preview">
              <span class="reply-badge-label">Seller Response:</span>
              <p class="reply-preview-text">"{{ item.sellerReply }}"</p>
            </div>
          </div>
        </template>

        <!-- Cell: Status -->
        <template #cell(status)="{ item }">
          <span
            class="status-badge"
            :style="{ backgroundColor: statusBadgeColor(item.status) + '15', color: statusBadgeColor(item.status) }"
          >
            {{ item.status }}
          </span>
        </template>

        <!-- Cell: Date -->
        <template #cell(createdAt)="{ item }">
          <span class="date-cell">{{ formatDate(item.createdAt) }}</span>
        </template>

        <!-- Cell: Actions -->
        <template #cell(actions)="{ item }">
          <div class="actions-wrapper">
            <!-- Hide Toggle -->
            <button
              v-if="item.status === 'active'"
              class="action-btn action-hide"
              title="Hide Review publicly"
              @click="handleToggleHideReview(item)"
            >
              <EyeOff class="action-icon" />
            </button>
            <button
              v-else
              class="action-btn action-restore"
              title="Restore Review publicly"
              @click="handleToggleHideReview(item)"
            >
              <RotateCcw class="action-icon" />
            </button>

            <!-- Delete Permanently -->
            <button
              class="action-btn action-delete"
              title="Delete Permanently"
              @click="handleDeleteReview(item)"
            >
              <Trash2 class="action-icon" />
            </button>
          </div>
        </template>

        <!-- Custom empty placeholder -->
        <template #empty>
          <div class="empty-state-container">
            <MessageSquareOff class="empty-state-icon" />
            <h4>No Reviews Moderated</h4>
            <p>We couldn't find any product feedback reviews matching your query filters.</p>
            <button class="clear-filters-btn" type="button" @click="clearSearch">Clear Search</button>
          </div>
        </template>
      </BaseTable>

      <BasePagination
        :currentPage="currentPage"
        :totalPages="totalPages"
        @change="handlePageChange"
      />
    </template>

    <!-- Global Confirmation Dialog Overlay -->
    <BaseConfirmDialog
      v-model="showConfirmDialog"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      :variant="confirmDialogVariant"
      :loading="confirmDialogLoading"
      @confirm="handleConfirmDialogAction"
      @cancel="handleConfirmDialogCancel"
    />
  </div>
</template>

<style scoped>
.admin-reviews-page {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 32px;
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

/* Controls Toolbar */
.controls-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.search-input-wrap {
  position: relative;
  flex: 1;
  max-width: 450px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--color-muted);
  pointer-events: none;
}

.search-input-box {
  width: 100%;
  padding: 12px 16px 12px 48px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  background-color: var(--color-surface);
  color: var(--color-text);
  box-sizing: border-box;
}

.search-input-box:focus {
  outline: none;
  border-color: var(--color-accent);
}

/* Product and reviewer info cells */
.product-info-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

.product-name {
  font-weight: 700;
  color: var(--color-text);
  max-width: 200px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-id-sub {
  font-family: var(--font-mono, monospace);
  font-size: 0.72rem;
  color: var(--color-muted);
}

.user-info-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

.user-name {
  font-weight: 600;
  color: var(--color-text);
}

.user-email {
  font-size: 0.8rem;
  color: var(--color-muted);
}

/* Stars Rating */
.stars-rating-wrap {
  display: flex;
  gap: 2px;
  justify-content: center;
}

.star-icon {
  width: 14px;
  height: 14px;
}

.star-icon--filled {
  color: var(--color-accent, #f59e0b);
  fill: var(--color-accent, #f59e0b);
}

.star-icon--empty {
  color: var(--color-border);
}

.comment-text-box {
  color: var(--color-text);
  display: inline-block;
  max-width: 400px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-transform: capitalize;
  display: inline-block;
}

.date-cell {
  color: var(--color-muted);
}

/* Actions list */
.actions-wrapper {
  display: inline-flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  background: none;
  border: 1px solid var(--color-border);
  padding: 6px;
  border-radius: var(--radius-md);
  color: var(--color-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--color-bg-alt);
  color: var(--color-text);
  border-color: var(--color-muted);
}

.action-hide:hover {
  border-color: #f59e0b;
  color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.05);
}

.action-restore:hover {
  border-color: #10b981;
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.05);
}

.action-delete:hover {
  border-color: #ef4444;
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.05);
}

.action-icon {
  width: 14px;
  height: 14px;
}

/* Empty State */
.empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 360px;
  margin: 0 auto;
}

.empty-state-icon {
  width: 48px;
  height: 48px;
  color: var(--color-muted);
  opacity: 0.5;
  margin-bottom: 8px;
}

.empty-state-container h4 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.empty-state-container p {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--color-muted);
  margin: 0;
  line-height: 1.5;
  white-space: normal;
}

.clear-filters-btn {
  margin-top: 8px;
  padding: 8px 16px;
  background-color: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-filters-btn:hover {
  background-color: var(--color-border);
}

/* Error Banner */
.error-banner {
  text-align: center;
  padding: 80px 24px;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.error-banner h3 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.error-banner p {
  font-family: var(--font-sans);
  color: var(--color-muted);
  margin: 0 0 24px 0;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.retry-btn:hover {
  opacity: 0.9;
}

.comment-cell-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.admin-reply-preview {
  background-color: var(--color-bg-alt);
  border-left: 2px solid var(--color-primary);
  padding: 6px 10px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  max-width: 400px;
}

.reply-badge-label {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
}

.reply-preview-text {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  line-height: 1.3;
  color: var(--color-text);
  margin: 2px 0 0 0;
  font-style: italic;
}
</style>
