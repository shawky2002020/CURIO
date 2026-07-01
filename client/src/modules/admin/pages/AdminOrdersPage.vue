<script setup lang="ts">
/**
 * AdminOrdersPage
 * Administrative Order Management dashboard.
 * Uses BaseTable, BasePagination, BaseModal, and BaseConfirmDialog.
 * Enhanced with backend pagination and orders stats insights cards.
 */
import { ref, onMounted, watch } from 'vue';
import { adminApi, type OrderRegistryItem } from '../../../api/admin.api.js';
import { useToastStore } from '../../../stores/toast.store.js';
import {
  Search,
  Eye,
  CheckCircle,
  Truck,
  PackageCheck,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
  ShoppingBag,
} from '@lucide/vue';

// UI Base Components
import BaseTable from '../../../components/ui/BaseTable.vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BaseConfirmDialog from '../../../components/ui/BaseConfirmDialog.vue';
import BaseSelect from '../../../components/ui/BaseSelect.vue';
import BasePagination from '../../../components/ui/BasePagination.vue';

const toastStore = useToastStore();

const loading = ref(true);
const error = ref<string | null>(null);

const orders = ref<OrderRegistryItem[]>([]);
const filteredOrders = ref<OrderRegistryItem[]>([]);
const search = ref('');
const statusFilter = ref('');

// Table Headers
const tableHeaders = [
  { key: 'orderNumber', label: 'Order Number' },
  { key: 'customer', label: 'Customer' },
  { key: 'sellers', label: 'Seller(s)' },
  { key: 'amount', label: 'Amount' },
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
const activeOrder = ref<OrderRegistryItem | null>(null);

// Confirmation Dialog state
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');
const confirmDialogVariant = ref<'primary' | 'danger' | 'warning'>('primary');
const confirmDialogLoading = ref(false);
const onConfirmCallback = ref<(() => Promise<void>) | null>(null);

const fetchOrders = async (page = 1) => {
  loading.value = true;
  error.value = null;
  try {
    const response = await adminApi.fetchOrders({
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

const getSellersList = (order: OrderRegistryItem): string[] => {
  if (!order.items) return [];
  const sellers = new Set<string>();
  order.items.forEach((item) => {
    const seller = item.productId?.seller;
    if (seller && typeof seller === 'object' && seller.fullName) {
      sellers.add(seller.fullName);
    } else if (item.image) {
      // Fallback
      sellers.add('Studio Partner');
    }
  });
  return Array.from(sellers);
};

const openViewModal = (order: OrderRegistryItem) => {
  activeOrder.value = order;
  showViewModal.value = true;
};

const closeModals = () => {
  showViewModal.value = false;
  activeOrder.value = null;
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

const handleStatusUpdate = (order: OrderRegistryItem, newStatus: any) => {
  const variant = newStatus === 'cancelled' ? 'danger' : 'primary';
  const labelMap: Record<string, string> = {
    confirmed: 'Accept/Confirm',
    cancelled: 'Cancel',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
  };

  triggerConfirm(
    `${labelMap[newStatus] || 'Update'} Order`,
    `Are you sure you want to mark Order #${order._id.substring(18).toUpperCase()} as "${newStatus}"?`,
    variant,
    async () => {
      try {
        const response = await adminApi.updateOrderStatus(order._id, newStatus);
        if (response.success) {
          toastStore.success(`Order status advanced to: ${newStatus}`);
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
  <div class="admin-orders-page">
    <!-- Header -->
    <header class="page-header">
      <div class="title-wrap">
        <h1 class="page-title">Manage Orders</h1>
        <p class="page-subtitle">Track receipts, check payments, and audit seller fulfillment logistics.</p>
      </div>
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
          placeholder="Search by Buyer Name, Email, or Order Reference ID..."
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
        emptyText="No orders found"
      >
        <!-- Cell: Order Number -->
        <template #cell(orderNumber)="{ item }">
          <span class="order-id-label" @click="openViewModal(item)">
            #{{ item._id.substring(18).toUpperCase() }}
          </span>
        </template>

        <!-- Cell: Customer -->
        <template #cell(customer)="{ item }">
          <div class="customer-info-cell">
            <span class="customer-name">{{ item.shippingAddress.fullName }}</span>
            <span class="customer-email" v-if="item.userId">{{ item.userId.email }}</span>
            <span class="customer-email" v-else>{{ item.shippingAddress.email }}</span>
          </div>
        </template>

        <!-- Cell: Sellers -->
        <template #cell(sellers)="{ item }">
          <div class="sellers-cell-list">
            <span v-for="seller in getSellersList(item)" :key="seller" class="seller-tag">
              {{ seller }}
            </span>
          </div>
        </template>

        <!-- Cell: Amount -->
        <template #cell(amount)="{ item }">
          <strong>${{ item.totals.total.toFixed(2) }}</strong>
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
          <span :class="['status-badge', statusBadgeClass(item.status)]">
            {{ item.status }}
          </span>
        </template>

        <!-- Cell: Date -->
        <template #cell(createdAt)="{ item }">
          <span class="date-cell">{{ formatDate(item.createdAt) }}</span>
        </template>

        <!-- Cell: Actions -->
        <template #cell(actions)="{ item }">
          <div class="actions-buttons">
            <button class="action-btn" title="View Details" @click="openViewModal(item)">
              <Eye class="action-icon" />
            </button>

            <!-- confirmed -->
            <button
              v-if="item.status === 'pending'"
              class="action-btn action-confirm"
              title="Confirm Order"
              @click="handleStatusUpdate(item, 'confirmed')"
            >
              <CheckCircle class="action-icon" />
            </button>

            <!-- processing -->
            <button
              v-if="item.status === 'confirmed'"
              class="action-btn action-process"
              title="Mark Processing"
              @click="handleStatusUpdate(item, 'processing')"
            >
              <PackageCheck class="action-icon" />
            </button>

            <!-- shipped -->
            <button
              v-if="item.status === 'processing'"
              class="action-btn action-ship"
              title="Mark Shipped"
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

            <!-- cancel -->
            <button
              v-if="item.status !== 'delivered' && item.status !== 'cancelled'"
              class="action-btn action-cancel"
              title="Cancel Order"
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

    <!-- MODAL: View Order Details -->
    <BaseModal :show="showViewModal" title="Order Management Sheet" size="lg" @close="closeModals">
      <div v-if="activeOrder" class="details-modal-grid">
        <!-- Panel 1: Customer Details -->
        <div class="details-section shadow-section">
          <h3 class="details-section-title"><User class="section-icon" /> Customer & Delivery</h3>
          <div class="details-read-grid">
            <div class="read-group">
              <span class="read-label">Full Name</span>
              <span class="read-value">{{ activeOrder.shippingAddress.fullName }}</span>
            </div>
            <div class="read-group">
              <span class="read-label">Email Address</span>
              <span class="read-value">{{ activeOrder.shippingAddress.email }}</span>
            </div>
            <div class="read-group">
              <span class="read-label">Phone Number</span>
              <span class="read-value">{{ activeOrder.shippingAddress.phone }}</span>
            </div>
            <div class="read-group read-group--full">
              <span class="read-label">Destination Address</span>
              <span class="read-value">
                {{ activeOrder.shippingAddress.address }}, {{ activeOrder.shippingAddress.city }},
                {{ activeOrder.shippingAddress.country }} (ZIP: {{ activeOrder.shippingAddress.postalCode }})
              </span>
            </div>
          </div>
        </div>

        <!-- Panel 2: Logistics & Payment -->
        <div class="details-section shadow-section">
          <h3 class="details-section-title"><Calendar class="section-icon" /> Logistics & Auditing</h3>
          <div class="details-read-grid">
            <div class="read-group">
              <span class="read-label">Order Created</span>
              <span class="read-value">{{ formatDate(activeOrder.createdAt) }}</span>
            </div>
            <div class="read-group">
              <span class="read-label">Payment Method</span>
              <span class="read-value uppercase-val">{{ activeOrder.paymentMethod === 'cash' ? 'Cash on Arrival (COD)' : 'Stripe Card' }}</span>
            </div>
            <div class="read-group">
              <span class="read-label">Payment Status</span>
              <span class="read-value">
                <span :class="['status-badge', paymentBadgeClass(activeOrder.paymentStatus)]">
                  {{ activeOrder.paymentStatus }}
                </span>
              </span>
            </div>
            <div class="read-group">
              <span class="read-label">Global Status</span>
              <span class="read-value">
                <span :class="['status-badge', statusBadgeClass(activeOrder.status)]">
                  {{ activeOrder.status }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Panel 3: Order Items Table -->
        <div class="details-section shadow-section details-section--full">
          <h3 class="details-section-title"><ShoppingBag class="section-icon" /> Ordered Items Audit</h3>
          <table class="details-items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in activeOrder.items" :key="item.productId?._id || item.name">
                <td>
                  <div class="product-cell-detail">
                    <img v-if="item.image" :src="item.image" class="product-cell-thumb" alt="Product" />
                    <div class="product-meta-cell">
                      <span class="product-cell-name">{{ item.name }}</span>
                      <span class="product-cell-seller" v-if="item.productId?.seller">
                        Studio: {{ item.productId.seller.fullName }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="font-mono">${{ item.price.toFixed(2) }}</td>
                <td class="text-center">{{ item.quantity }}</td>
                <td class="text-right font-mono">${{ (item.price * item.quantity).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totals Row -->
          <div class="receipt-divider"></div>
          <div class="totals-breakdown-box">
            <div class="totals-line">
              <span>Subtotal:</span>
              <span class="font-mono">${{ activeOrder.totals.subtotal.toFixed(2) }}</span>
            </div>
            <div class="totals-line" v-if="activeOrder.totals.discount > 0">
              <span>Promo Code Discount:</span>
              <span class="font-mono text-danger">-${{ activeOrder.totals.discount.toFixed(2) }}</span>
            </div>
            <div class="totals-line">
              <span>Shipping Fee:</span>
              <span class="font-mono">${{ activeOrder.totals.shipping.toFixed(2) }}</span>
            </div>
            <div class="totals-line">
              <span>Taxes (10%):</span>
              <span class="font-mono">${{ activeOrder.totals.tax.toFixed(2) }}</span>
            </div>
            <div class="totals-line totals-line--grand">
              <span>Grand Total:</span>
              <span class="font-mono">${{ activeOrder.totals.total.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="close-modal-btn" @click="closeModals">Close Sheet</button>
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
.admin-orders-page {
  padding: 32px;
  max-width: 1280px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 28px;
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

.sellers-cell-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-start;
}

.seller-tag {
  background-color: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
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

/* Modal layout details */
.details-modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  text-align: left;
}

@media (max-width: 768px) {
  .details-modal-grid {
    grid-template-columns: 1fr;
  }
}

.details-section {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.details-section--full {
  grid-column: 1 / -1;
}

.details-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-h);
  margin: 0 0 20px 0;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 10px;
}

.section-icon {
  width: 18px;
  height: 18px;
  color: var(--color-primary);
}

.details-read-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.read-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.read-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.read-value {
  font-size: 0.95rem;
  color: var(--color-text-h);
  font-weight: 600;
}

.uppercase-val {
  text-transform: uppercase;
}

.details-items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.details-items-table th {
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

.details-items-table td {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.9rem;
}

.product-cell-detail {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-cell-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.product-meta-cell {
  display: flex;
  flex-direction: column;
}

.product-cell-name {
  font-weight: 700;
  color: var(--color-text-h);
}

.product-cell-seller {
  font-size: 0.75rem;
  color: var(--color-muted);
}

.receipt-divider {
  border-top: 2px dashed var(--color-border);
  margin: 20px 0;
}

.totals-breakdown-box {
  width: 320px;
  margin-left: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.totals-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--color-text);
}

.totals-line--grand {
  border-top: 1px solid var(--color-border);
  padding-top: 10px;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-primary);
}

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
</style>
