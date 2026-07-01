<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useSellerProductStore } from '../../../stores/sellerProduct.store.js';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BasePagination from '../../../components/ui/BasePagination.vue';
import { useToastStore } from '../../../stores/toast.store.js';
import {
  Package,
  Save,
  Search,
  RefreshCw,
  AlertTriangle,
} from '@lucide/vue';

const sellerProductStore = useSellerProductStore();
const toastStore = useToastStore();

const searchInput = ref('');
const debounceTimer = ref<any>(null);

// Tracks stock edits locally: product_id -> stock value
const editValues = ref<Record<string, number>>({});
const editErrors = ref<Record<string, string>>({});
const rowLoading = ref<Record<string, boolean>>({});

onMounted(async () => {
  searchInput.value = sellerProductStore.filters.search;
  // Always restrict inventory query to all active statuses (excluding soft-deleted)
  sellerProductStore.filters.status = '';
  await Promise.all([
    sellerProductStore.fetchProducts(1),
    sellerProductStore.fetchLowStockThreshold(),
  ]);
  initializeEditValues();
});

const initializeEditValues = () => {
  sellerProductStore.products.forEach((prod) => {
    editValues.value[prod._id] = prod.stock;
  });
};

// Re-initialize local values when store products array is updated (e.g. after search/pagination)
watch(() => sellerProductStore.products, () => {
  initializeEditValues();
}, { deep: true });

const onSearchInput = (val: string) => {
  searchInput.value = val;
  if (debounceTimer.value) clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    sellerProductStore.filters.search = val;
    sellerProductStore.fetchProducts(1);
  }, 400);
};

const handlePageChange = (page: number) => {
  sellerProductStore.fetchProducts(page);
};

const validateStock = (id: string): boolean => {
  const val = editValues.value[id];
  delete editErrors.value[id];

  if (val === undefined || val === null || String(val).trim() === '') {
    editErrors.value[id] = 'Stock is required.';
    return false;
  }
  if (val < 0) {
    editErrors.value[id] = 'Must be ≥ 0.';
    return false;
  }
  if (!Number.isInteger(val)) {
    editErrors.value[id] = 'Must be integer.';
    return false;
  }
  return true;
};

const handleSaveStock = async (id: string) => {
  if (!validateStock(id)) return;

  const newStock = editValues.value[id];
  rowLoading.value[id] = true;
  
  try {
    const res = await sellerProductStore.updateStock(id, newStock);
    if (res.success) {
      toastStore.success('Product inventory updated successfully.');
      delete editErrors.value[id];
    }
  } catch (err: any) {
    editErrors.value[id] = err.response?.data?.message || 'Update failed.';
    toastStore.error(err.response?.data?.message || 'Failed to update inventory.');
  } finally {
    rowLoading.value[id] = false;
  }
};
</script>

<template>
  <div class="seller-inventory-page">
    <!-- Header -->
    <header class="page-header">
      <div class="title-wrap">
        <h1 class="page-title">Inventory Controls</h1>
        <p class="page-subtitle">Quickly adjust stock quantities and monitor replenishment alerts.</p>
      </div>

      <button class="sync-btn" @click="sellerProductStore.fetchProducts(sellerProductStore.pagination.page)" :disabled="sellerProductStore.loading">
        <RefreshCw :class="['btn-icon', { 'spin-animation': sellerProductStore.loading }]" /> Refresh Inventory
      </button>
    </header>

    <!-- Controls Row -->
    <section class="controls-card">
      <div class="search-input-wrap">
        <Search class="search-icon" />
        <input
          type="text"
          :value="searchInput"
          @input="onSearchInput(($event.target as HTMLInputElement).value)"
          placeholder="Filter inventory by product name..."
          class="search-field"
        />
      </div>

      <div class="threshold-hint-badge">
        <AlertTriangle class="hint-icon" />
        <span>Low Stock Alert threshold is configured at: <strong>{{ sellerProductStore.lowStockThreshold }} units</strong></span>
      </div>
    </section>

    <!-- Table -->
    <div class="table-card">
      <div v-if="sellerProductStore.loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading inventory metrics...</p>
      </div>

      <div v-else-if="sellerProductStore.products.length === 0" class="empty-state">
        <Package class="empty-icon" />
        <h3>No inventory found</h3>
        <p v-if="sellerProductStore.filters.search">
          No active products match search terms.
        </p>
        <p v-else>
          Add products in the catalog to activate inventory warnings!
        </p>
      </div>

      <div v-else class="table-responsive">
        <table class="inventory-table">
          <thead>
            <tr>
              <th class="col-product">Product</th>
              <th class="col-status">Current Status</th>
              <th class="col-badge">Replenishment Alert</th>
              <th class="col-edit">Update Quantity</th>
              <th class="col-save">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="prod in sellerProductStore.products"
              :key="prod._id"
              class="inventory-row"
              :class="{ 'out-of-stock-row': prod.stock === 0 }"
            >
              <!-- Info -->
              <td class="col-product">
                <div class="product-cell-info">
                  <div class="image-wrapper">
                    <img
                      v-if="prod.images && prod.images[0]"
                      :src="prod.images[0]"
                      alt="Thumbnail"
                      class="thumb-img"
                    />
                    <div v-else class="thumb-placeholder">
                      <Package class="placeholder-icon" />
                    </div>
                  </div>
                  <div class="meta-details">
                    <span class="product-title-text">{{ prod.name }}</span>
                    <span class="category-text">{{ prod.categoryId?.name || 'Uncategorized' }}</span>
                  </div>
                </div>
              </td>

              <!-- Stock Count display -->
              <td class="col-status">
                <span class="qty-display">{{ prod.stock }} units currently</span>
              </td>

              <!-- Status Badge (derived vs dynamic lowStockThreshold) -->
              <td class="col-badge">
                <span
                  class="badge-stock"
                  :class="{
                    'oos': prod.stock === 0,
                    'low': prod.stock > 0 && prod.stock <= sellerProductStore.lowStockThreshold,
                    'in': prod.stock > sellerProductStore.lowStockThreshold
                  }"
                >
                  {{ prod.stock === 0 ? 'Out of Stock' : prod.stock <= sellerProductStore.lowStockThreshold ? 'Low Stock Warning' : 'In Stock' }}
                </span>
              </td>

              <!-- Stock edit field -->
              <td class="col-edit">
                <div class="edit-input-wrap">
                  <input
                    type="number"
                    v-model.number="editValues[prod._id]"
                    min="0"
                    step="1"
                    class="stock-input"
                    :class="{ 'has-error': editErrors[prod._id] }"
                    :disabled="rowLoading[prod._id]"
                    @keydown.enter.prevent="handleSaveStock(prod._id)"
                  />
                  <span v-if="editErrors[prod._id]" class="error-inline">{{ editErrors[prod._id] }}</span>
                </div>
              </td>

              <!-- Save button action -->
              <td class="col-save">
                <BaseButton
                  type="button"
                  variant="primary"
                  :loading="rowLoading[prod._id]"
                  :disabled="editValues[prod._id] === prod.stock || rowLoading[prod._id]"
                  @click="handleSaveStock(prod._id)"
                  class="save-btn-compact"
                >
                  <Save class="save-icon" /> Save
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Table pagination footer -->
        <BasePagination
          :currentPage="sellerProductStore.pagination.page"
          :totalPages="sellerProductStore.pagination.pages"
          @change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.seller-inventory-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1100px;
  margin: 0 auto;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.title-wrap {
  text-align: left;
}

.page-title {
  font-family: var(--font-heading, inherit);
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text-h);
  margin: 0;
}

.page-subtitle {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: var(--color-muted);
  margin: 4px 0 0 0;
}

.sync-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-h);
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.sync-btn:hover:not(:disabled) {
  background-color: rgba(15, 61, 94, 0.04);
}

.sync-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.spin-animation {
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.controls-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 250px;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: var(--color-muted);
}

.search-field {
  width: 100%;
  padding: 10px 12px 10px 38px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-text-h);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  box-sizing: border-box;
}

.search-field:focus {
  outline: none;
  border-color: var(--color-primary);
}

.threshold-hint-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #b45309;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.8rem;
}

.hint-icon {
  width: 14px;
  height: 14px;
  color: #f59e0b;
}

.table-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.loading-state,
.empty-state {
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--color-muted);
}

.empty-state h3 {
  font-family: var(--font-sans);
  font-size: 1.15rem;
  color: var(--color-text-h);
  margin: 0;
}

.empty-state p {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: var(--color-muted);
  max-width: 400px;
  margin: 0;
}

.spinner {
  border: 3px solid rgba(15, 61, 94, 0.1);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.inventory-table th {
  padding: 14px 20px;
  font-family: var(--font-sans);
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-muted);
  background-color: rgba(15, 61, 94, 0.01);
  border-bottom: 1px solid var(--color-border);
}

.inventory-table td {
  padding: 16px 20px;
  vertical-align: middle;
  border-bottom: 1px solid var(--color-border);
}

.inventory-row {
  transition: background-color 0.2s;
}

.inventory-row:hover {
  background-color: rgba(15, 61, 94, 0.005);
}

.out-of-stock-row {
  background-color: rgba(239, 68, 68, 0.02);
}

.product-cell-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.image-wrapper {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
  background-color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
}

.placeholder-icon {
  width: 18px;
  height: 18px;
}

.meta-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.product-title-text {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-h);
}

.category-text {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--color-muted);
}

.qty-display {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-h);
}

.badge-stock {
  font-family: var(--font-sans);
  font-size: 0.725rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  display: inline-block;
}

.badge-stock.oos {
  background-color: rgba(239, 68, 68, 0.15);
  color: #b91c1c;
}

.badge-stock.low {
  background-color: rgba(245, 158, 11, 0.15);
  color: #b45309;
}

.badge-stock.in {
  background-color: rgba(16, 185, 129, 0.15);
  color: #047857;
}

.edit-input-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.stock-input {
  width: 90px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-text-h);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  box-sizing: border-box;
}

.stock-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.stock-input.has-error {
  border-color: var(--color-error);
}

.error-inline {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  color: var(--color-error);
  font-weight: 500;
}

.save-btn-compact {
  padding: 8px 14px;
  font-size: 0.8rem;
}

.save-icon {
  width: 12px;
  height: 12px;
  margin-right: 4px;
}
</style>
