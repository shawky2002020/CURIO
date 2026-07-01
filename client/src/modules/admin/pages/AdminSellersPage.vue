<script setup lang="ts">
/**
 * AdminSellersPage
 * Administrative Store / Seller Management dashboard.
 * Uses BaseTable, BasePagination, BaseModal, and BaseConfirmDialog.
 */
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '../../../api/admin.api.js';
import type { SellerRegistryItem } from '../../../api/admin.api.js';
import {
  Search,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Briefcase,
  ExternalLink,
} from '@lucide/vue';

// UI Base Components
import BaseTable from '../../../components/ui/BaseTable.vue';
import BasePagination from '../../../components/ui/BasePagination.vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BaseConfirmDialog from '../../../components/ui/BaseConfirmDialog.vue';

const router = useRouter();

const loading = ref(true);
const error = ref<string | null>(null);

const sellers = ref<SellerRegistryItem[]>([]);
const totalSellers = ref(0);
const totalPages = ref(1);
const currentPage = ref(1);
const limitPerPage = ref(10);

// Demographics stats
const stats = ref({
  totalCustomers: 0,
  activeCustomers: 0,
  totalSellers: 0,
  activeSellers: 0,
});

const search = ref('');

// Table Configuration
const tableHeaders = [
  { key: 'storeName', label: 'Store Name' },
  { key: 'fullName', label: 'Owner' },
  { key: 'productsCount', label: 'Products Count', align: 'center' as const },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Joined At' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
];

// Modals & Dialogs state
const showViewModal = ref(false);
const activeSeller = ref<SellerRegistryItem | null>(null);

const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');
const confirmDialogVariant = ref<'primary' | 'danger' | 'warning'>('primary');
const confirmDialogLoading = ref(false);
const onConfirmCallback = ref<(() => Promise<void>) | null>(null);

// Feedback
const feedbackMessage = ref<string | null>(null);
const feedbackType = ref<'success' | 'error'>('success');

const triggerFeedback = (message: string, type: 'success' | 'error' = 'success') => {
  feedbackMessage.value = message;
  feedbackType.value = type;
  setTimeout(() => {
    feedbackMessage.value = null;
  }, 4000);
};

const fetchSellers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await adminApi.fetchSellers({
      page: currentPage.value,
      limit: limitPerPage.value,
      search: search.value.trim() || undefined,
    });
    if (response.success && response.data) {
      sellers.value = response.data.sellers;
      totalSellers.value = response.data.total;
      totalPages.value = response.data.pages;
      if (response.data.stats) {
        stats.value = response.data.stats;
      }
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to load seller list.';
  } finally {
    loading.value = false;
  }
};

// Search trigger
let searchTimeout: any = null;
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchSellers();
  }, 350);
});

onMounted(() => {
  fetchSellers();
});

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchSellers();
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const statusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: '#10b981',
    blocked: '#f59e0b',
    deleted: '#ef4444',
  };
  return colors[status] || '#a3aab8';
};

const openViewModal = (seller: SellerRegistryItem) => {
  activeSeller.value = seller;
  showViewModal.value = true;
};

const closeModals = () => {
  showViewModal.value = false;
  activeSeller.value = null;
};

// Confirm dialog actions helper
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
const handleStatusUpdate = (seller: SellerRegistryItem, newStatus: 'active' | 'blocked' | 'deleted') => {
  const actionLabel = newStatus === 'active' ? 'Approve' : newStatus === 'blocked' ? 'Suspend' : 'Reject';
  const variant = newStatus === 'active' ? 'primary' : newStatus === 'blocked' ? 'warning' : 'danger';
  
  const title = `${actionLabel} Seller Partner`;
  const confirmMsg = newStatus === 'deleted'
    ? `Are you sure you want to REJECT and soft-delete ${seller.fullName}'s store account?`
    : `Are you sure you want to ${actionLabel.toLowerCase()} ${seller.fullName}'s store?`;

  openConfirm(title, confirmMsg, variant, async () => {
    try {
      const response = await adminApi.updateUser(seller._id, { status: newStatus });
      if (response.success) {
        triggerFeedback(`Successfully changed store status to: ${newStatus}.`, 'success');
        fetchSellers();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update store status.';
      triggerFeedback(msg, 'error');
      throw err;
    }
  });
};

const viewProducts = (seller: SellerRegistryItem) => {
  router.push({ name: 'admin-products', query: { seller: seller._id } });
};

const clearSearch = () => {
  search.value = '';
};
</script>

<template>
  <div class="admin-sellers-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">Store Management</h1>
        <p class="page-subtitle">Audit stores, approve seller partnerships, and restrict active storefronts.</p>
      </div>
    </header>

    <!-- Demographics/Insights Statistics Banner -->
    <section class="insights-stats-row" v-if="stats.totalCustomers > 0 || stats.totalSellers > 0">
      <div class="stat-card stat-card--collectors">
        <span class="stat-card-label">Total Collectors</span>
        <strong class="stat-card-value">{{ stats.totalCustomers }}</strong>
      </div>
      <div class="stat-card stat-card--active-collectors">
        <span class="stat-card-label">Active Collectors</span>
        <strong class="stat-card-value">{{ stats.activeCustomers }}</strong>
      </div>
      <div class="stat-card stat-card--studios">
        <span class="stat-card-label">Total Studios</span>
        <strong class="stat-card-value">{{ stats.totalSellers }}</strong>
      </div>
      <div class="stat-card stat-card--active-studios">
        <span class="stat-card-label">Active Studios</span>
        <strong class="stat-card-value">{{ stats.activeSellers }}</strong>
      </div>
    </section>

    <!-- Feedback -->
    <Transition name="fade">
      <div v-if="feedbackMessage" class="feedback-toast" :class="feedbackType">
        <AlertTriangle v-if="feedbackType === 'error'" class="toast-icon" />
        <CheckCircle v-else class="toast-icon" />
        <span>{{ feedbackMessage }}</span>
      </div>
    </Transition>

    <!-- Controls Toolbar -->
    <section class="controls-panel">
      <div class="search-input-wrap">
        <Search class="search-icon" />
        <input
          v-model="search"
          type="text"
          placeholder="Search stores or owners..."
          class="search-box-input"
        />
      </div>
    </section>

    <!-- Error -->
    <div v-if="error" class="error-boundary">
      <AlertTriangle class="error-icon" />
      <h3>Failed to load stores list</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchSellers">Retry</button>
    </div>

    <!-- Store Table -->
    <template v-else>
      <BaseTable
        :headers="tableHeaders"
        :items="sellers"
        :loading="loading"
        emptyText="No Store Partners Found"
      >
        <!-- Cell: Store Name -->
        <template #cell(storeName)="{ item }">
          <span class="store-name-text">{{ item.storeName || (item.fullName + "'s Gallery") }}</span>
        </template>


        <!-- Cell: Owner -->
        <template #cell(fullName)="{ item }">
          {{ item.fullName }}
        </template>

        <!-- Cell: Products Count -->
        <template #cell(productsCount)="{ item }">
          <span class="products-count-badge">{{ item.productsCount }}</span>
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

        <!-- Cell: Joined At -->
        <template #cell(createdAt)="{ item }">
          <span class="date-cell">{{ formatDate(item.createdAt) }}</span>
        </template>

        <!-- Cell: Actions -->
        <template #cell(actions)="{ item }">
          <div class="actions-buttons-wrap">
            <button class="action-btn" title="View details" @click="openViewModal(item)">
              <Eye class="action-icon" />
            </button>
            
            <button class="action-btn" title="View store listings" @click="viewProducts(item)">
              <ExternalLink class="action-icon" />
            </button>

            <!-- Approve -->
            <button
              v-if="item.status !== 'active'"
              class="action-btn action-approve"
              title="Approve storefront"
              @click="handleStatusUpdate(item, 'active')"
            >
              <CheckCircle class="action-icon" />
            </button>

            <!-- Suspend -->
            <button
              v-if="item.status === 'active'"
              class="action-btn action-suspend"
              title="Suspend storefront"
              @click="handleStatusUpdate(item, 'blocked')"
            >
              <AlertTriangle class="action-icon" />
            </button>

            <!-- Reject (Soft Delete) -->
            <button
              v-if="item.status !== 'deleted'"
              class="action-btn action-reject"
              title="Reject/Soft Delete storefront"
              @click="handleStatusUpdate(item, 'deleted')"
            >
              <XCircle class="action-icon" />
            </button>
          </div>
        </template>

        <!-- Custom empty placeholder -->
        <template #empty>
          <div class="empty-state-container">
            <Briefcase class="empty-state-icon" />
            <h4>No Stores Found</h4>
            <p>We couldn't find any storefront matching your query filters.</p>
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

    <!-- MODAL: View Details -->
    <BaseModal :show="showViewModal" title="Store Profile Details" @close="closeModals">
      <div v-if="activeSeller" class="read-only-grid">
        <div class="view-group">
          <span class="view-label">Seller ID</span>
          <span class="view-value mono">{{ activeSeller._id }}</span>
        </div>
        <div class="view-group">
          <span class="view-label">Store Registered Name</span>
          <span class="view-value">{{ activeSeller.storeName || (activeSeller.fullName + "'s Gallery") }}</span>
        </div>

        <div class="view-group">
          <span class="view-label">Store Owner</span>
          <span class="view-value">{{ activeSeller.fullName }}</span>
        </div>
        <div class="view-group">
          <span class="view-label">Owner Email</span>
          <span class="view-value">{{ activeSeller.email || '—' }}</span>
        </div>
        <div class="view-group">
          <span class="view-label">Owner Contact Phone</span>
          <span class="view-value">{{ activeSeller.phone || '—' }}</span>
        </div>
        <div class="view-group">
          <span class="view-label">Active Listings Count</span>
          <span class="view-value">{{ activeSeller.productsCount }} items listed</span>
        </div>
        <div class="view-group">
          <span class="view-label">Status Summary</span>
          <span class="view-value">
            <span
              class="status-badge"
              :style="{ backgroundColor: statusBadgeColor(activeSeller.status) + '15', color: statusBadgeColor(activeSeller.status) }"
            >
              {{ activeSeller.status }}
            </span>
          </span>
        </div>
        <div class="view-group">
          <span class="view-label">Created At</span>
          <span class="view-value">{{ formatDate(activeSeller.createdAt) }}</span>
        </div>
      </div>
      <template #footer>
        <button class="secondary-btn" @click="closeModals">Close Details</button>
      </template>
    </BaseModal>

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
.admin-sellers-page {
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

/* Controls Panel (Search/Filters) */
.controls-panel {
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

.search-box-input {
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

.search-box-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.store-name-text {
  font-weight: 700;
  color: var(--color-text);
}

.products-count-badge {
  background-color: var(--color-bg-alt);
  color: var(--color-primary);
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
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

.actions-buttons-wrap {
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

.action-approve:hover {
  border-color: #10b981;
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.05);
}

.action-suspend:hover {
  border-color: #f59e0b;
  color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.05);
}

.action-reject:hover {
  border-color: #ef4444;
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.05);
}

.action-icon {
  width: 14px;
  height: 14px;
}

/* Error Boundary */
.error-boundary {
  text-align: center;
  padding: 80px 24px;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.error-boundary h3 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.error-boundary p {
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

/* Detail view layout */
.read-only-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.view-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.view-label {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.view-value {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}

.view-value.mono {
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
}

.secondary-btn {
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  box-sizing: border-box;
}

.secondary-btn:hover {
  background-color: var(--color-bg-alt);
}

/* Feedback toasts */
.feedback-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 700;
  z-index: 1200;
}

.feedback-toast.success {
  background-color: #10b981;
  color: white;
}

.feedback-toast.error {
  background-color: #ef4444;
  color: white;
}

.toast-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Statistics Insights cards banner */
.insights-stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.03);
}

.stat-card-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.stat-card-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text-h);
}

.stat-card--collectors {
  border-left: 4px solid #6366f1;
}
.stat-card--active-collectors {
  border-left: 4px solid #10b981;
}
.stat-card--studios {
  border-left: 4px solid #3b82f6;
}
.stat-card--active-studios {
  border-left: 4px solid #059669;
}
</style>
