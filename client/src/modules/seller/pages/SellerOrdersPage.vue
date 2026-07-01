<script setup lang="ts">
/**
 * SellerOrdersPage
 * Page for sellers to manage orders containing their products.
 * Supports viewing details and advancing order status (Accept, Processing, Shipped, Delivered, Cancel).
 * Enhanced to handle multi-vendor orders, backend pagination, and dashboard stats counters.
 */
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '../../../stores/auth.store.js';
import { useToastStore } from '../../../stores/toast.store.js';
import cartApi, { type OrderData } from '../../../api/cart.api.js';
import {
  Search,
  Eye,
  CheckCircle,
  PackageCheck,
  Truck,
  XCircle,
  Calendar,
  User,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
  Copy,
} from '@lucide/vue';

// UI Base Components
import BaseTable from '../../../components/ui/BaseTable.vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BaseConfirmDialog from '../../../components/ui/BaseConfirmDialog.vue';
import BaseSelect from '../../../components/ui/BaseSelect.vue';
import BasePagination from '../../../components/ui/BasePagination.vue';

const authStore = useAuthStore();
const toastStore = useToastStore();

const loading = ref(true);
const error = ref<string | null>(null);

const orders = ref<OrderData[]>([]);
const filteredOrders = ref<OrderData[]>([]);
const search = ref('');
const statusFilter = ref('');

// Table Headers
const tableHeaders = [
  { key: 'orderNumber', label: 'Order Number' },
  { key: 'customer', label: 'Customer' },
  { key: 'products', label: 'My Products' },
  { key: 'quantity', label: 'Qty', align: 'center' as const },
  { key: 'amount', label: 'Subtotal' },
  { key: 'payment', label: 'Payment' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Date' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
];

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

// Pagination & Stats
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  pages: 1,
});

const stats = ref({
  total: 0,
  pending: 0,
  confirmed: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
});

// Detail Modal state
const showViewModal = ref(false);
const activeOrder = ref<OrderData | null>(null);

// Confirmation Dialog state
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');
const confirmDialogVariant = ref<'primary' | 'danger' | 'warning'>('primary');
const confirmDialogLoading = ref(false);
const onConfirmCallback = ref<(() => Promise<void>) | null>(null);

const currentUserId = computed(() => authStore.user?.id);

// Helper: Check if an order contains items from multiple different sellers
const isMultiSellerOrder = (order: OrderData): boolean => {
  if (!order.items) return false;
  const uniqueSellers = new Set<string>();
  order.items.forEach((item: any) => {
    const sellerId = item.productId?.seller?._id || item.productId?.seller || item.seller;
    if (sellerId) {
      uniqueSellers.add(sellerId.toString());
    }
  });
  return uniqueSellers.size > 1;
};

// Helper: Filter order items to only those belonging to the logged-in seller
const getSellerItems = (order: OrderData) => {
  if (!order.items || !currentUserId.value) return [];
  return order.items.filter((item: any) => {
    const sellerId = item.productId?.seller?._id || item.productId?.seller || item.seller;
    return sellerId === currentUserId.value;
  });
};

const getSellerSubtotal = (order: OrderData): number => {
  return getSellerItems(order).reduce((sum, item) => sum + item.price * item.quantity, 0);
};

const getSellerTotalQuantity = (order: OrderData): number => {
  return getSellerItems(order).reduce((sum, item) => sum + item.quantity, 0);
};

const fetchOrders = async (page = 1) => {
  loading.value = true;
  error.value = null;
  try {
    const response = await cartApi.getMyOrders({
      page,
      limit: pagination.value.limit,
      search: search.value,
      status: statusFilter.value,
    });
    if (response.success && response.data) {
      if (response.data.orders) {
        orders.value = response.data.orders;
        filteredOrders.value = response.data.orders;
        pagination.value.total = response.data.total;
        pagination.value.pages = response.data.pages;
        pagination.value.page = response.data.page;
        if (response.data.stats) {
          stats.value = response.data.stats;
        }
      } else {
        orders.value = response.data;
        filteredOrders.value = response.data;
      }
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to retrieve order history.';
  } finally {
    loading.value = false;
  }
};

let debounceTimeout: any = null;
watch([search, statusFilter], () => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetchOrders(1);
  }, 350);
});

onMounted(() => {
  fetchOrders(1);
});

const handlePageChange = (newPage: number) => {
  fetchOrders(newPage);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusBadgeClass = (status: string): string => {
  const mapping: Record<string, string> = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    processing: 'badge-processing',
    shipped: 'badge-shipped',
    delivered: 'badge-delivered',
    cancelled: 'badge-cancelled',
  };
  return mapping[status] || 'badge-default';
};

const paymentBadgeClass = (status?: string): string => {
  const s = status || 'pending';
  const mapping: Record<string, string> = {
    pending: 'badge-pending',
    paid: 'badge-paid',
    failed: 'badge-failed',
  };
  return mapping[s] || 'badge-default';
};

const openViewModal = (order: OrderData) => {
  activeOrder.value = order;
  showViewModal.value = true;
};

const closeModals = () => {
  showViewModal.value = false;
  activeOrder.value = null;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toastStore.success('Order Reference ID copied!');
};

// Dialog Trigger helper
const triggerConfirm = (
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

const handleConfirmAction = async () => {
  if (onConfirmCallback.value) {
    confirmDialogLoading.value = true;
    try {
      await onConfirmCallback.value();
      showConfirmDialog.value = false;
    } catch (err) {
      // Handled in callback
    } finally {
      confirmDialogLoading.value = false;
      onConfirmCallback.value = null;
    }
  }
};

const handleConfirmCancel = () => {
  onConfirmCallback.value = null;
};

const handleStatusUpdate = (order: OrderData, newStatus: any) => {
  const variant = newStatus === 'cancelled' ? 'danger' : 'primary';
  const labelMap: Record<string, string> = {
    confirmed: 'Accept',
    cancelled: 'Reject/Cancel',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
  };

  const dialogMessage = newStatus === 'cancelled' && isMultiSellerOrder(order)
    ? `Are you sure you want to Reject/Cancel your items in Order #${order._id.substring(18).toUpperCase()}? This will remove only your products and update the order total.`
    : `Are you sure you want to mark Order #${order._id.substring(18).toUpperCase()} as "${newStatus}"?`;

  triggerConfirm(
    `${labelMap[newStatus] || 'Update'} Order`,
    dialogMessage,
    variant,
    async () => {
      try {
        const response = await cartApi.updateOrderStatus(order._id, newStatus);
        if (response.success) {
          toastStore.success(
            newStatus === 'cancelled' && isMultiSellerOrder(order)
              ? `Your items were successfully cancelled from the order.`
              : `Order status advanced to status: ${newStatus}.`
          );
          fetchOrders(pagination.value.page);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Failed to update order status.';
        toastStore.error(msg);
        throw err;
      }
    }
  );
};
</script>

<template>
  <div class="seller-orders-page">
    <!-- Header -->
    <header class="page-header">
      <div class="title-wrap">
        <h1 class="page-title">Fulfillment Orders</h1>
        <p class="page-subtitle">Track payments, manage shipment logistics, and confirm buyer collections.</p>
      </div>

      <button class="sync-btn" @click="fetchOrders(pagination.page)" :disabled="loading">
        <RefreshCw :class="['btn-icon', { 'spin-animation': loading }]" /> Refresh List
      </button>
    </header>

    <!-- Statistics Insights Cards -->
    <section class="insights-stats-row" v-if="stats.total > 0">
      <div class="stat-card">
        <span class="stat-card-label">Total Orders</span>
        <strong class="stat-card-value">{{ stats.total }}</strong>
      </div>
      <div class="stat-card stat-card--pending">
        <span class="stat-card-label">Pending</span>
        <strong class="stat-card-value">{{ stats.pending }}</strong>
      </div>
      <div class="stat-card stat-card--confirmed">
        <span class="stat-card-label">Confirmed</span>
        <strong class="stat-card-value">{{ stats.confirmed }}</strong>
      </div>
      <div class="stat-card stat-card--processing">
        <span class="stat-card-label">Processing</span>
        <strong class="stat-card-value">{{ stats.processing }}</strong>
      </div>
      <div class="stat-card stat-card--shipped">
        <span class="stat-card-label">Shipped</span>
        <strong class="stat-card-value">{{ stats.shipped }}</strong>
      </div>
      <div class="stat-card stat-card--delivered">
        <span class="stat-card-label">Delivered</span>
        <strong class="stat-card-value">{{ stats.delivered }}</strong>
      </div>
      <div class="stat-card stat-card--cancelled">
        <span class="stat-card-label">Cancelled</span>
        <strong class="stat-card-value">{{ stats.cancelled }}</strong>
      </div>
    </section>

    <!-- Toolbar Filters -->
    <section class="controls-toolbar">
      <div class="search-input-wrap">
        <Search class="search-icon" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by Customer name, email, or full reference ID..."
          class="search-input-box"
        />
      </div>

      <div class="filter-select-wrap">
        <BaseSelect v-model="statusFilter" :options="statusOptions" placeholder="Filter by Status" />
      </div>
    </section>

    <!-- Error state -->
    <div v-if="error" class="error-banner">
      <AlertTriangle class="error-icon" />
      <h3>Failed to load orders</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchOrders(1)">Retry</button>
    </div>

    <!-- Orders Table -->
    <template v-else>
      <BaseTable
        :headers="tableHeaders"
        :items="filteredOrders"
        :loading="loading"
        emptyText="No studio orders found"
      >
        <!-- Cell: Order Number -->
        <template #cell(orderNumber)="{ item }">
          <span class="order-id-label" @click="openViewModal(item)" title="View Receipt">
            #{{ item._id.substring(18).toUpperCase() }}
          </span>
        </template>

        <!-- Cell: Customer -->
        <template #cell(customer)="{ item }">
          <div class="customer-info-cell">
            <span class="customer-name">{{ item.shippingAddress.fullName }}</span>
            <span class="customer-email">{{ item.shippingAddress.email }}</span>
          </div>
        </template>

        <!-- Cell: Products -->
        <template #cell(products)="{ item }">
          <div class="products-cell-list">
            <span v-for="prod in getSellerItems(item)" :key="prod.productId" class="prod-item-tag">
              {{ prod.name }}
            </span>
          </div>
        </template>

        <!-- Cell: Quantity -->
        <template #cell(quantity)="{ item }">
          <span class="qty-badge">{{ getSellerTotalQuantity(item) }}</span>
        </template>

        <!-- Cell: Amount -->
        <template #cell(amount)="{ item }">
          <strong>${{ getSellerSubtotal(item).toFixed(2) }}</strong>
        </template>

        <!-- Cell: Payment -->
        <template #cell(payment)="{ item }">
          <div class="payment-info-cell">
            <span :class="['status-badge', paymentBadgeClass(item.paymentStatus)]">
              {{ item.paymentStatus }}
            </span>
            <span class="payment-method-desc">via {{ item.paymentMethod === 'cash' ? 'COD' : 'Stripe' }}</span>
          </div>
        </template>

        <!-- Cell: Status -->
        <template #cell(status)="{ item }">
          <div class="status-cell-wrap">
            <span :class="['status-badge', statusBadgeClass(item.status)]">
              {{ item.status }}
            </span>
            <span v-if="isMultiSellerOrder(item)" class="multi-seller-badge" title="Fulfillment logistics are managed by administrators since this order includes products from other studio partners.">
              Multi-Studio
            </span>
          </div>
        </template>

        <!-- Cell: Date -->
        <template #cell(createdAt)="{ item }">
          <span class="date-cell">{{ formatDate(item.createdAt) }}</span>
        </template>

        <!-- Cell: Actions -->
        <template #cell(actions)="{ item }">
          <div class="actions-buttons">
            <button class="action-btn" title="View Receipt Breakdown" @click="openViewModal(item)">
              <Eye class="action-icon" />
            </button>

            <!-- Only display logistics options for Single-Vendor Orders -->
            <template v-if="!isMultiSellerOrder(item)">
              <!-- confirmed (Accept) -->
              <button
                v-if="item.status === 'pending'"
                class="action-btn action-confirm"
                title="Accept Order"
                @click="handleStatusUpdate(item, 'confirmed')"
              >
                <CheckCircle class="action-icon" />
              </button>

              <!-- processing -->
              <button
                v-if="item.status === 'confirmed'"
                class="action-btn action-process"
                title="Start Processing"
                @click="handleStatusUpdate(item, 'processing')"
              >
                <PackageCheck class="action-icon" />
              </button>

              <!-- shipped -->
              <button
                v-if="item.status === 'processing'"
                class="action-btn action-ship"
                title="Ship Package"
                @click="handleStatusUpdate(item, 'shipped')"
              >
                <Truck class="action-icon" />
              </button>

              <!-- delivered -->
              <button
                v-if="item.status === 'shipped'"
                class="action-btn action-deliver"
                title="Mark Delivered"
                @click="handleStatusUpdate(item, 'delivered')"
              >
                <CheckCircle class="action-icon" />
              </button>
            </template>

            <!-- Reject / Cancel Portion (Always allowed so seller can reject their own items) -->
            <button
              v-if="item.status !== 'delivered' && item.status !== 'cancelled'"
              class="action-btn action-cancel"
              :title="isMultiSellerOrder(item) ? 'Cancel My Portion' : 'Reject/Cancel Order'"
              @click="handleStatusUpdate(item, 'cancelled')"
            >
              <XCircle class="action-icon" />
            </button>
          </div>
        </template>
      </BaseTable>

      <div class="orders-pagination-wrap" v-if="pagination.pages > 1">
        <BasePagination
          :currentPage="pagination.page"
          :totalPages="pagination.pages"
          @change="handlePageChange"
        />
      </div>
    </template>

    <!-- MODAL: View Order Details (Premium Register Receipt) -->
    <BaseModal :show="showViewModal" title="Order Receipt Slip" size="lg" @close="closeModals">
      <div v-if="activeOrder">
        <!-- Hero Invoice Header -->
        <div class="receipt-header-hero">
          <div class="receipt-headline">
            <span class="receipt-label">CURIO REGISTER SLIP</span>
            <h2 class="receipt-invoice-id">
              Order #{{ activeOrder._id.substring(18).toUpperCase() }}
              <button class="copy-btn-minimal" @click="copyToClipboard(activeOrder._id)" title="Copy Full Reference ID">
                <Copy class="copy-icon-small" />
              </button>
            </h2>
            <span class="full-ref-id-sub">REF ID: {{ activeOrder._id }}</span>
          </div>
          <div class="receipt-badge-status-row">
            <span :class="['status-badge', statusBadgeClass(activeOrder.status)]">
              {{ activeOrder.status }}
            </span>
            <span v-if="isMultiSellerOrder(activeOrder)" class="multi-seller-badge-pill">
              Multi-Studio Fulfillment
            </span>
          </div>
        </div>

        <div class="invoice-details-grid">
          <!-- Customer Card -->
          <div class="invoice-card-section">
            <h4 class="card-section-hdr"><User class="hdr-icon" /> BUYER INFO</h4>
            <div class="invoice-data-lines">
              <div class="data-line">
                <span class="data-lbl">Name</span>
                <span class="data-val">{{ activeOrder.shippingAddress.fullName }}</span>
              </div>
              <div class="data-line">
                <span class="data-lbl">Email</span>
                <span class="data-val">{{ activeOrder.shippingAddress.email }}</span>
              </div>
              <div class="data-line">
                <span class="data-lbl">Phone</span>
                <span class="data-val">{{ activeOrder.shippingAddress.phone }}</span>
              </div>
              <div class="data-line data-line--full">
                <span class="data-lbl">Shipping Address</span>
                <span class="data-val">
                  {{ activeOrder.shippingAddress.address }}, {{ activeOrder.shippingAddress.city }},
                  {{ activeOrder.shippingAddress.country }} (ZIP: {{ activeOrder.shippingAddress.postalCode }})
                </span>
              </div>
            </div>
          </div>

          <!-- Transaction Card -->
          <div class="invoice-card-section">
            <h4 class="card-section-hdr"><Calendar class="hdr-icon" /> TRANSACTION INFO</h4>
            <div class="invoice-data-lines">
              <div class="data-line">
                <span class="data-lbl">Date Curated</span>
                <span class="data-val">{{ formatDate(activeOrder.createdAt) }}</span>
              </div>
              <div class="data-line">
                <span class="data-lbl">Payment Type</span>
                <span class="data-val uppercase-val">{{ activeOrder.paymentMethod === 'cash' ? 'COD (Cash)' : 'Stripe Card' }}</span>
              </div>
              <div class="data-line">
                <span class="data-lbl">Payment Status</span>
                <span class="data-val">
                  <span :class="['payment-badge', activeOrder.paymentStatus]">
                    {{ activeOrder.paymentStatus }}
                  </span>
                </span>
              </div>
              <div v-if="isMultiSellerOrder(activeOrder)" class="data-line data-line--full notice-row">
                <span class="data-val note-alert">
                  <AlertTriangle class="note-icon" /> Central admin manages fulfillment logistics for multi-vendor transactions.
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Curated items checklist -->
        <div class="invoice-items-card">
          <h4 class="card-section-hdr"><ShoppingBag class="hdr-icon" /> CURATED ITEMS</h4>
          <table class="premium-invoice-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th class="text-center">Price</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in getSellerItems(activeOrder)" :key="item.productId">
                <td>
                  <div class="invoice-product-cell">
                    <img v-if="item.image" :src="item.image" class="invoice-thumb" alt="Product" />
                    <div class="invoice-prod-info">
                      <span class="invoice-prod-name">{{ item.name }}</span>
                      <span class="invoice-prod-id">REF: #{{ ((item.productId as any)?._id || item.productId || '').toString().substring(18).toUpperCase() }}</span>
                    </div>
                  </div>
                </td>
                <td class="text-center font-mono">${{ item.price.toFixed(2) }}</td>
                <td class="text-center">{{ item.quantity }}</td>
                <td class="text-right font-mono">${{ (item.price * item.quantity).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="invoice-bottom-totals">
            <div class="invoice-dashed-divider"></div>
            <div class="receipt-summary-box">
              <div class="summary-line">
                <span>My Items Subtotal</span>
                <span class="font-mono">${{ getSellerSubtotal(activeOrder).toFixed(2) }}</span>
              </div>
              <div class="summary-line summary-line--grand">
                <span>Net Studio Claim</span>
                <span class="font-mono">${{ getSellerSubtotal(activeOrder).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="close-modal-btn" @click="closeModals">Close Receipt</button>
      </template>
    </BaseModal>

    <!-- Global Confirmation dialog overlay -->
    <BaseConfirmDialog
      v-model="showConfirmDialog"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      :variant="confirmDialogVariant"
      :loading="confirmDialogLoading"
      @confirm="handleConfirmAction"
      @cancel="handleConfirmCancel"
    />
  </div>
</template>

<style scoped>
.seller-orders-page {
  padding: 32px;
  max-width: 1280px;
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

/* Statistics Insights cards banner */
.insights-stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
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

.stat-card--pending {
  border-left: 4px solid #d97706;
}
.stat-card--confirmed {
  border-left: 4px solid #0284c7;
}
.stat-card--processing {
  border-left: 4px solid #7c3aed;
}
.stat-card--shipped {
  border-left: 4px solid #f59e0b;
}
.stat-card--delivered {
  border-left: 4px solid #059669;
}
.stat-card--cancelled {
  border-left: 4px solid #dc2626;
}

/* Toolbar filters */
.controls-toolbar {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .controls-toolbar {
    grid-template-columns: 1fr;
  }
}

.search-input-wrap {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--color-muted);
}

.search-input-box {
  width: 100%;
  padding: 12px 16px 12px 42px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text-h);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.search-input-box:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(15, 61, 94, 0.1);
}

.filter-select-wrap {
  width: 100%;
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

.order-id-label {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--color-accent);
  cursor: pointer;
}

.order-id-label:hover {
  text-decoration: underline;
}

.customer-info-cell {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.customer-name {
  font-weight: 600;
  color: var(--color-text-h);
}

.customer-email {
  font-size: 0.8rem;
  color: var(--color-muted);
}

.products-cell-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-start;
}

.prod-item-tag {
  background-color: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  color: var(--color-text-h);
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.qty-badge {
  background-color: var(--color-primary);
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
}

.payment-info-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.payment-method-desc {
  font-size: 0.75rem;
  color: var(--color-muted);
}

.date-cell {
  font-size: 0.85rem;
  color: var(--color-muted);
}

.actions-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.action-btn {
  background: none;
  border: 1px solid var(--color-border);
  padding: 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text);
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: var(--color-bg-alt);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.action-confirm:hover {
  color: #10b981;
  border-color: #10b981;
}

.action-process:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.action-ship:hover {
  color: #f59e0b;
  border-color: #f59e0b;
}

.action-deliver:hover {
  color: #10b981;
  border-color: #10b981;
}

.action-cancel:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.action-icon {
  width: 16px;
  height: 16px;
}

/* Pagination container */
.orders-pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* Modal CSS details */
.close-modal-btn {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 10px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.close-modal-btn:hover {
  background-color: var(--color-bg-alt);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Badges CSS standard */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: var(--radius-pill);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-pending {
  background-color: #fef3c7;
  color: #d97706;
}

.badge-confirmed {
  background-color: #e0f2fe;
  color: #0284c7;
}

.badge-processing {
  background-color: #f3e8ff;
  color: #7c3aed;
}

.badge-shipped {
  background-color: #fffbeb;
  color: #d97706;
}

.badge-delivered {
  background-color: #d1fae5;
  color: #059669;
}

.badge-cancelled {
  background-color: #fee2e2;
  color: #dc2626;
}

.badge-paid {
  background-color: #d1fae5;
  color: #059669;
}

.badge-failed {
  background-color: #fee2e2;
  color: #dc2626;
}

.text-center {
  text-align: center !important;
}

.text-right {
  text-align: right !important;
}

.font-mono {
  font-family: var(--font-mono);
}

/* Premium Invoice UI Customizations */
.receipt-header-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  background-color: var(--color-bg-alt);
  border-bottom: 2px dashed var(--color-border);
  margin-bottom: 24px;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.receipt-headline {
  text-align: left;
}

.receipt-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: block;
  margin-bottom: 4px;
}

.receipt-invoice-id {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-text-h);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.full-ref-id-sub {
  font-size: 0.75rem;
  color: var(--color-muted);
  font-family: var(--font-mono);
  display: block;
  margin-top: 2px;
}

.copy-btn-minimal {
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.copy-btn-minimal:hover {
  background-color: var(--color-border);
  color: var(--color-primary);
}

.copy-icon-small {
  width: 14px;
  height: 14px;
}

.receipt-badge-status-row {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.invoice-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 0 24px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .invoice-details-grid {
    grid-template-columns: 1fr;
  }
}

.invoice-card-section {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.01);
  text-align: left;
}

.card-section-hdr {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-h);
  margin: 0 0 16px 0;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
}

.hdr-icon {
  width: 16px;
  height: 16px;
  color: var(--color-primary);
}

.invoice-data-lines {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.data-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.03);
  padding-bottom: 8px;
}

.data-line--full {
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  border-bottom: none;
  padding-bottom: 0;
}

.data-lbl {
  color: var(--color-muted);
  font-weight: 500;
}

.data-val {
  color: var(--color-text-h);
  font-weight: 600;
}

.uppercase-val {
  text-transform: uppercase;
}

.payment-badge {
  display: inline-flex;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.payment-badge.paid {
  background-color: #d1fae5;
  color: #059669;
}

.payment-badge.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.payment-badge.failed {
  background-color: #fee2e2;
  color: #dc2626;
}

.notice-row {
  background-color: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: var(--radius-md);
  padding: 10px 12px;
  margin-top: 4px;
}

.note-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #b45309;
  font-weight: 500;
  line-height: 1.4;
}

.note-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.invoice-items-card {
  margin: 0 24px 20px 24px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.01);
  text-align: left;
}

.premium-invoice-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.premium-invoice-table th {
  background-color: var(--color-bg-alt);
  color: var(--color-muted);
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 2px solid var(--color-border);
}

.premium-invoice-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.9rem;
  vertical-align: middle;
}

.invoice-product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.invoice-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  transition: transform 0.2s;
}

.invoice-thumb:hover {
  transform: scale(1.08);
}

.invoice-prod-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

.invoice-prod-name {
  font-weight: 700;
  color: var(--color-text-h);
}

.invoice-prod-id {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-muted);
}

.invoice-dashed-divider {
  border-top: 2px dashed var(--color-border);
  margin: 16px 0;
}

.invoice-bottom-totals {
  width: 100%;
}

.receipt-summary-box {
  width: 280px;
  margin-left: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  color: var(--color-text);
}

.summary-line--grand {
  border-top: 1px solid var(--color-border);
  padding-top: 8px;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-primary);
}

/* Row-level multi-studio order styles */
.status-cell-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.multi-seller-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #b45309;
  background-color: #fffbeb;
  border: 1px solid #fef3c7;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  cursor: help;
}

.multi-seller-badge-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #b45309;
  background-color: #fffbeb;
  border: 1px solid #fef3c7;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
}
</style>
