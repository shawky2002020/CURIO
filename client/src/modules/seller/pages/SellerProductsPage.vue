<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSellerProductStore } from '../../../stores/sellerProduct.store.js';
import { useCategoryStore } from '../../../stores/category.store.js';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BaseConfirmDialog from '../../../components/ui/BaseConfirmDialog.vue';
import BasePagination from '../../../components/ui/BasePagination.vue';
import SellerProductForm from '../components/SellerProductForm.vue';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Archive,
  CheckCircle,
  TrendingDown,
  Package,
} from '@lucide/vue';
import type { Product } from '../../../types/product.types.js';

const sellerProductStore = useSellerProductStore();
const categoryStore = useCategoryStore();

const isFormModalOpen = ref(false);
const isConfirmOpen = ref(false);
const productToDelete = ref<string | null>(null);
const editingProduct = ref<Product | null>(null);
const submitting = ref(false);
const actionLoading = ref<string | null>(null);

const debounceTimer = ref<any>(null);
const searchInput = ref('');

onMounted(async () => {
  searchInput.value = sellerProductStore.filters.search;
  await Promise.all([
    sellerProductStore.fetchProducts(),
    sellerProductStore.fetchLowStockThreshold(),
    categoryStore.categories.length === 0 ? categoryStore.fetchCategories() : Promise.resolve(),
  ]);
});

const onSearchInput = (val: string) => {
  searchInput.value = val;
  if (debounceTimer.value) clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    sellerProductStore.filters.search = val;
    sellerProductStore.fetchProducts(1);
  }, 400);
};

const onFilterChange = () => {
  sellerProductStore.fetchProducts(1);
};

const resetFilters = () => {
  searchInput.value = '';
  sellerProductStore.resetFilters();
  sellerProductStore.fetchProducts(1);
};

const handlePageChange = (page: number) => {
  sellerProductStore.fetchProducts(page);
};

const openAddModal = () => {
  editingProduct.value = null;
  isFormModalOpen.value = true;
};

const openEditModal = (product: Product) => {
  editingProduct.value = product;
  isFormModalOpen.value = true;
};

const handleFormCancel = () => {
  isFormModalOpen.value = false;
  editingProduct.value = null;
};

const handleFormSubmit = async ({ form, files }: { form: any; files: File[] }) => {
  submitting.value = true;
  try {
    if (editingProduct.value) {
      // Edit product
      const res = await sellerProductStore.updateProduct(editingProduct.value._id, form);
      // Wait: in edit mode, image uploads might have been done directly in the uploader component.
      // But if there are files (should not happen since edit uploads immediately, but let's double check):
      if (files.length > 0 && res.success) {
        await sellerProductStore.uploadImages(editingProduct.value._id, files);
      }
    } else {
      // Create product
      // If the user selected 'active', we first create it as 'draft' to allow image uploading,
      // then publish it once images are attached.
      const targetStatus = form.status;
      const createPayload = { ...form };
      if (targetStatus === 'active') {
        createPayload.status = 'draft';
      }

      const res = await sellerProductStore.createProduct(createPayload);
      if (res.success && res.data) {
        if (files.length > 0) {
          await sellerProductStore.uploadImages(res.data._id, files);
        }
        if (targetStatus === 'active') {
          await sellerProductStore.updateProduct(res.data._id, { status: 'active' });
        }
      }
    }
    isFormModalOpen.value = false;
    editingProduct.value = null;
    await sellerProductStore.fetchProducts(1);
  } catch (err) {
    console.error('Failed to submit form', err);
  } finally {
    submitting.value = false;
  }
};

const triggerPublish = async (id: string, publish: boolean) => {
  actionLoading.value = id;
  try {
    await sellerProductStore.updateProduct(id, {
      status: publish ? 'active' : 'draft',
    });
  } catch (err) {
    console.error('Failed to change product status', err);
  } finally {
    actionLoading.value = null;
  }
};

const triggerArchive = async (id: string, archive: boolean) => {
  actionLoading.value = id;
  try {
    await sellerProductStore.updateProduct(id, {
      status: archive ? 'archived' : 'active',
    });
  } catch (err) {
    console.error('Failed to archive/unarchive product', err);
  } finally {
    actionLoading.value = null;
  }
};

const confirmDeleteProduct = (id: string) => {
  productToDelete.value = id;
  isConfirmOpen.value = true;
};

const handleDeleteConfirm = async () => {
  if (!productToDelete.value) return;
  submitting.value = true;
  try {
    await sellerProductStore.deleteProduct(productToDelete.value);
    isConfirmOpen.value = false;
    productToDelete.value = null;
  } catch (err) {
    console.error('Failed to delete product', err);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="seller-products-page">
    <!-- Header -->
    <header class="page-header">
      <div class="title-wrap">
        <h1 class="page-title">Manage Products</h1>
        <p class="page-subtitle">Add, publish, and manage your studio collection.</p>
      </div>

      <BaseButton type="button" variant="primary" @click="openAddModal">
        <Plus class="btn-icon" /> Add Product
      </BaseButton>
    </header>

    <!-- Statistics Insights Cards -->
    <section class="insights-stats-row" v-if="sellerProductStore.stats.total > 0">
      <div class="stat-card">
        <span class="stat-card-label">Total Products</span>
        <strong class="stat-card-value">{{ sellerProductStore.stats.total }}</strong>
      </div>
      <div class="stat-card stat-card--active">
        <span class="stat-card-label">Active</span>
        <strong class="stat-card-value">{{ sellerProductStore.stats.active }}</strong>
      </div>
      <div class="stat-card stat-card--draft">
        <span class="stat-card-label">Draft / Hidden</span>
        <strong class="stat-card-value">{{ sellerProductStore.stats.draft }}</strong>
      </div>
      <div class="stat-card stat-card--archived">
        <span class="stat-card-label">Archived / Moderated</span>
        <strong class="stat-card-value">{{ sellerProductStore.stats.archived }}</strong>
      </div>
    </section>

    <!-- Filters Section -->
    <section class="filters-bar-card">
      <div class="filters-grid">
        <!-- Search bar -->
        <div class="search-input-wrap">
          <Search class="search-icon" />
          <input
            type="text"
            :value="searchInput"
            @input="onSearchInput(($event.target as HTMLInputElement).value)"
            placeholder="Search by name or description..."
            class="search-field"
          />
        </div>

        <!-- Category Filter -->
        <div class="filter-select-wrap">
          <label class="filter-label"><Filter class="label-icon" /> Category</label>
          <select
            v-model="sellerProductStore.filters.categoryId"
            @change="onFilterChange"
            class="filter-select"
          >
            <option value="">All Categories</option>
            <option
              v-for="cat in categoryStore.categories"
              :key="cat._id"
              :value="cat._id"
            >
              {{ cat.name }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="filter-select-wrap">
          <label class="filter-label"><CheckCircle class="label-icon" /> Visibility</label>
          <select
            v-model="sellerProductStore.filters.status"
            @change="onFilterChange"
            class="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="draft">Drafts</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <!-- Stock Warning Filter -->
        <div class="filter-select-wrap">
          <label class="filter-label"><Package class="label-icon" /> Stock Warning</label>
          <select
            v-model="sellerProductStore.filters.stockStatus"
            @change="onFilterChange"
            class="filter-select"
          >
            <option value="">All Inventory</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock Warning</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      <!-- Active Filters Row -->
      <div 
        v-if="
          sellerProductStore.filters.search ||
          sellerProductStore.filters.categoryId ||
          sellerProductStore.filters.status ||
          sellerProductStore.filters.stockStatus
        " 
        class="active-filters-row"
      >
        <button type="button" class="clear-filters-btn" @click="resetFilters">
          Clear Filters & Search
        </button>
      </div>
    </section>

    <!-- Main Products Table -->
    <div class="table-card">
      <div v-if="sellerProductStore.loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your products...</p>
      </div>

      <div v-else-if="sellerProductStore.products.length === 0" class="empty-state">
        <Package class="empty-icon" />
        <h3>No products found</h3>
        <p v-if="
          sellerProductStore.filters.search ||
          sellerProductStore.filters.categoryId ||
          sellerProductStore.filters.status ||
          sellerProductStore.filters.stockStatus
        ">
          Try adjusting your search terms or active filters.
        </p>
        <p v-else>
          Get started by adding your first product listing to CURIO!
        </p>
        <BaseButton v-if="
          sellerProductStore.filters.search ||
          sellerProductStore.filters.categoryId ||
          sellerProductStore.filters.status ||
          sellerProductStore.filters.stockStatus
        " type="button" variant="ghost" @click="resetFilters">
          Reset Filters
        </BaseButton>
        <BaseButton v-else type="button" variant="primary" @click="openAddModal">
          Add Product
        </BaseButton>
      </div>

      <div v-else class="table-responsive">
        <table class="products-table">
          <thead>
            <tr>
              <th class="col-product">Product</th>
              <th class="col-cat">Category</th>
              <th class="col-price">Price</th>
              <th class="col-stock">Stock</th>
              <th class="col-status">Status</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="prod in sellerProductStore.products"
              :key="prod._id"
              class="product-row"
              :class="{ 'out-of-stock-row': prod.stock === 0 }"
            >
              <!-- Info & Image -->
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
                    <p class="desc-preview">{{ prod.description }}</p>
                  </div>
                </div>
              </td>

              <!-- Category -->
              <td class="col-cat">
                <span class="category-badge">{{ prod.categoryId?.name || 'Uncategorized' }}</span>
              </td>

              <!-- Price -->
              <td class="col-price">
                <div class="price-stack">
                  <div v-if="prod.discount && prod.discount > 0" class="discount-pricing">
                    <span class="effective-val">${{ prod.effectivePrice }}</span>
                    <span class="original-val">${{ prod.price }}</span>
                    <span class="percent-badge"><TrendingDown class="percent-icon" /> -{{ prod.discount }}%</span>
                  </div>
                  <span v-else class="base-val">${{ prod.price }}</span>
                </div>
              </td>

              <!-- Stock status -->
              <td class="col-stock">
                <div class="stock-meta">
                  <span class="stock-qty-text">{{ prod.stock }} units</span>
                  <span
                    class="badge-stock"
                    :class="{
                      'oos': prod.stockStatus === 'out',
                      'low': prod.stockStatus === 'low',
                      'in': prod.stockStatus === 'in'
                    }"
                  >
                    {{ prod.stockStatus === 'out' ? 'Out of Stock' : prod.stockStatus === 'low' ? 'Low Stock' : 'In Stock' }}
                  </span>
                </div>
              </td>

              <!-- Status -->
              <td class="col-status">
                <div class="status-stack">
                  <span
                    class="badge-visibility"
                    :class="{
                      'draft': prod.status === 'draft',
                      'active': prod.status === 'active',
                      'archived': prod.status === 'archived'
                    }"
                  >
                    {{ prod.status === 'draft' ? 'Draft' : prod.status === 'active' ? 'Active' : 'Archived' }}
                  </span>
                  <span v-if="prod.status === 'archived' && prod.archivedByAdmin" class="badge-moderator">
                    Moderated by Admin
                  </span>
                </div>
              </td>

              <!-- Actions -->
              <td class="col-actions">
                <div class="actions-group">
                  <!-- Publish draft -->
                  <button
                    v-if="prod.status === 'draft'"
                    type="button"
                    class="action-btn-cta success"
                    @click="triggerPublish(prod._id, true)"
                    :disabled="actionLoading === prod._id"
                    title="Publish listing"
                  >
                    Publish
                  </button>

                  <!-- Unpublish active to draft -->
                  <button
                    v-if="prod.status === 'active'"
                    type="button"
                    class="action-btn-cta warning"
                    @click="triggerPublish(prod._id, false)"
                    :disabled="actionLoading === prod._id"
                    title="Unpublish to Draft"
                  >
                    Unpublish
                  </button>

                  <!-- Archive active -->
                  <button
                    v-if="prod.status === 'active'"
                    type="button"
                    class="action-btn-icon archive"
                    @click="triggerArchive(prod._id, true)"
                    :disabled="actionLoading === prod._id"
                    title="Archive listing"
                  >
                    <Archive class="action-icon" />
                  </button>

                  <!-- Unarchive archived -->
                  <button
                    v-if="prod.status === 'archived'"
                    type="button"
                    class="action-btn-cta primary-action"
                    @click="triggerArchive(prod._id, false)"
                    :disabled="actionLoading === prod._id"
                    title="Re-publish to marketplace"
                  >
                    Unarchive
                  </button>

                  <!-- Edit -->
                  <button
                    type="button"
                    class="action-btn-icon edit"
                    @click="openEditModal(prod)"
                    :disabled="actionLoading === prod._id"
                    title="Edit product"
                  >
                    <Edit class="action-icon" />
                  </button>

                  <!-- Delete -->
                  <button
                    type="button"
                    class="action-btn-icon delete"
                    @click="confirmDeleteProduct(prod._id)"
                    :disabled="actionLoading === prod._id"
                    title="Delete product"
                  >
                    <Trash2 class="action-icon" />
                  </button>
                </div>
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

    <!-- Add/Edit Product Modal Dialog -->
    <BaseModal
      :show="isFormModalOpen"
      :title="editingProduct ? 'Edit Product Details' : 'Add New Product Listing'"
      size="lg"
      @close="handleFormCancel"
    >
      <SellerProductForm
        :product="editingProduct"
        :loading="submitting"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
      />
    </BaseModal>

    <!-- Delete Confirmation Modal Dialog -->
    <BaseConfirmDialog
      v-model="isConfirmOpen"
      title="Delete Product Listing?"
      message="Are you sure you want to delete this product listing? This product will be hidden from buyers. Your existing order history will not be affected."
      confirmLabel="Yes, Delete"
      cancelLabel="Cancel"
      variant="danger"
      :loading="submitting"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<style scoped>
.seller-products-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
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

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.filters-bar-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .filters-grid {
    grid-template-columns: 1.5fr 1fr 1fr 1fr;
  }
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
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

.filter-select-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
}

.label-icon {
  width: 12px;
  height: 12px;
}

.filter-select {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-text-h);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  cursor: pointer;
  width: 100%;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.active-filters-row {
  display: flex;
  justify-content: flex-start;
}

.clear-filters-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.clear-filters-btn:hover {
  color: #0d3451;
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
  margin: 0 0 8px 0;
}

.spinner {
  border: 3px solid rgba(15, 61, 94, 0.1);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.products-table th {
  padding: 14px 20px;
  font-family: var(--font-sans);
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-muted);
  background-color: rgba(15, 61, 94, 0.01);
  border-bottom: 1px solid var(--color-border);
}

.products-table td {
  padding: 16px 20px;
  vertical-align: middle;
  border-bottom: 1px solid var(--color-border);
}

.product-row {
  transition: background-color 0.2s;
}

.product-row:hover {
  background-color: rgba(15, 61, 94, 0.005);
}

.out-of-stock-row {
  background-color: rgba(239, 68, 68, 0.015);
}

.product-cell-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.image-wrapper {
  width: 48px;
  height: 48px;
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
  width: 20px;
  height: 20px;
}

.meta-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.product-title-text {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-h);
}

.desc-preview {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--color-muted);
  margin: 4px 0 0 0;
  display: -webkit-box;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 250px;
}

.category-badge {
  background-color: rgba(15, 61, 94, 0.04);
  color: var(--color-text-h);
  font-family: var(--font-sans);
  font-size: 0.775rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
}

.price-stack {
  display: flex;
  flex-direction: column;
}

.base-val {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-h);
}

.discount-pricing {
  display: flex;
  align-items: center;
  gap: 6px;
}

.effective-val {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-primary);
}

.original-val {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  text-decoration: line-through;
  color: var(--color-muted);
}

.percent-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.percent-icon {
  width: 10px;
  height: 10px;
}

.stock-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.stock-qty-text {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-h);
}

.badge-stock {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.badge-stock.oos {
  background-color: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}

.badge-stock.low {
  background-color: rgba(245, 158, 11, 0.1);
  color: rgb(245, 158, 11);
}

.badge-stock.in {
  background-color: rgba(16, 185, 129, 0.1);
  color: rgb(16, 185, 129);
}

.status-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.badge-visibility {
  font-family: var(--font-sans);
  font-size: 0.725rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: uppercase;
}

.badge-visibility.draft {
  background-color: #e2e8f0;
  color: #475569;
}

.badge-visibility.active {
  background-color: rgba(16, 185, 129, 0.15);
  color: #047857;
}

.badge-visibility.archived {
  background-color: rgba(239, 68, 68, 0.15);
  color: #b91c1c;
}

.badge-moderator {
  font-family: var(--font-sans);
  font-size: 0.65rem;
  color: #b91c1c;
  font-weight: 600;
  text-align: left;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn-cta {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn-cta.success {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
}

.action-btn-cta.success:hover {
  background-color: #10b981;
  color: #fff;
}

.action-btn-cta.warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.2);
}

.action-btn-cta.warning:hover {
  background-color: #f59e0b;
  color: #fff;
}

.action-btn-cta.primary-action {
  background-color: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border-color: rgba(99, 102, 241, 0.2);
}

.action-btn-cta.primary-action:hover {
  background-color: #6366f1;
  color: #fff;
}

.action-btn-icon {
  background: none;
  border: 1px solid var(--color-border);
  padding: 6px;
  border-radius: var(--radius-md);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn-icon:hover {
  background-color: rgba(15, 61, 94, 0.04);
}

.action-btn-icon.archive:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.action-btn-icon.edit:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.action-btn-icon.delete:hover {
  color: var(--color-error);
  border-color: var(--color-error);
}

.action-icon {
  width: 14px;
  height: 14px;
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

.stat-card--active {
  border-left: 4px solid #059669;
}
.stat-card--draft {
  border-left: 4px solid #d97706;
}
.stat-card--archived {
  border-left: 4px solid #dc2626;
}
</style>
