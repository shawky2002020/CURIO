<script setup lang="ts">
/**
 * AdminProductsPage
 * Administrative Product Management dashboard supporting robust filters (Category,
 * Seller, Price, Stock), and moderation controls (View, Edit, Delete, Hide, Restore)
 * composed using BaseTable, BasePagination, BaseModal, and BaseConfirmDialog.
 */
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductStore } from '../../../stores/product.store.js';
import { useCategoryStore } from '../../../stores/category.store.js';
import { useToastStore } from '../../../stores/toast.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';
import { adminApi } from '../../../api/admin.api.js';
import type { CreateProductPayload } from '../../../types/product.types.js';
import { Plus, Pencil, Trash2, Package, Eye, ShieldAlert, RotateCcw, SlidersHorizontal } from '@lucide/vue';

// UI Base Components
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseTable from '../../../components/ui/BaseTable.vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BaseConfirmDialog from '../../../components/ui/BaseConfirmDialog.vue';
import BaseSelect from '../../../components/ui/BaseSelect.vue';

const productStore = useProductStore();
const categoryStore = useCategoryStore();
const toastStore = useToastStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

// Filter States
const filters = ref({
  search: '',
  categoryId: '',
  seller: '',
  stockStatus: 'all' as 'all' | 'in' | 'out' | 'low',
  status: 'all',
  minPrice: undefined as number | undefined,
  maxPrice: undefined as number | undefined,
});

const sellersList = ref<any[]>([]);

// Table headers computed dynamically based on role
const tableHeaders = computed(() => {
  const cols: Array<{ key: string; label: string; align?: 'left' | 'center' | 'right'; width?: string }> = [
    { key: 'images', label: 'Image', width: '80px' },
    { key: 'name', label: 'Name' },
  ];
  if (authStore.user?.role === 'admin') {
    cols.push({ key: 'seller', label: 'Seller' });
  }
  cols.push(
    { key: 'categoryId', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions', align: 'right' as const }
  );
  return cols;
});

// Dropdown Options
const categoryOptions = computed(() => {
  const opts = [{ label: 'All Categories', value: '' }];
  categoryStore.categories.forEach((cat) => {
    if (cat.status !== 'deleted') {
      opts.push({ label: cat.name, value: cat._id });
    }
  });
  return opts;
});

const sellerOptions = computed(() => {
  const opts = [{ label: 'All Sellers', value: '' }];
  sellersList.value.forEach((sel) => {
    opts.push({ label: sel.fullName, value: sel._id });
  });
  return opts;
});

const stockStatusOptions = [
  { label: 'All Stock Levels', value: 'all' },
  { label: 'In Stock (> 0)', value: 'in' },
  { label: 'Low Stock (<= 5)', value: 'low' },
  { label: 'Out of Stock (= 0)', value: 'out' },
];

const productStatusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft / Hidden', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

// Product Edit/Create Modal state
const showModal = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const imagesInput = ref(''); // comma-separated URLs
const errors = ref<Record<string, string>>({});

const emptyForm = (): CreateProductPayload => ({
  name: '',
  description: '',
  price: 0,
  stock: 0,
  categoryId: '',
  images: [],
  status: 'active',
});

const form = ref<CreateProductPayload>(emptyForm());
const modalTitle = computed(() => (editingId.value ? 'Edit Product' : 'New Product'));

// Confirm dialog state
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');
const confirmDialogVariant = ref<'primary' | 'danger' | 'warning'>('primary');
const confirmDialogLoading = ref(false);
const onConfirmCallback = ref<(() => Promise<void>) | null>(null);

const applyFilters = async () => {
  const activeFilters: any = {
    search: filters.value.search.trim() || undefined,
    categoryId: filters.value.categoryId || undefined,
    stockStatus: filters.value.stockStatus !== 'all' ? filters.value.stockStatus : undefined,
    status: filters.value.status || undefined,
    minPrice: filters.value.minPrice !== undefined && filters.value.minPrice !== null ? filters.value.minPrice : undefined,
    maxPrice: filters.value.maxPrice !== undefined && filters.value.maxPrice !== null ? filters.value.maxPrice : undefined,
  };

  // Seller role isolation check
  if (authStore.user?.role === 'seller') {
    activeFilters.seller = authStore.user.id;
  } else if (filters.value.seller) {
    activeFilters.seller = filters.value.seller;
  }

  await productStore.fetchProducts(activeFilters);
};

// Reset Filters
const resetFilters = () => {
  filters.value = {
    search: '',
    categoryId: '',
    seller: '',
    stockStatus: 'all',
    status: 'all',
    minPrice: undefined,
    maxPrice: undefined,
  };
  applyFilters();
};

// Filter Watchers
let filterTimeout: any = null;
watch(
  () => [
    filters.value.categoryId,
    filters.value.seller,
    filters.value.stockStatus,
    filters.value.status,
  ],
  () => {
    applyFilters();
  }
);

watch(
  () => [filters.value.search, filters.value.minPrice, filters.value.maxPrice],
  () => {
    if (filterTimeout) clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      applyFilters();
    }, 400);
  }
);

onMounted(async () => {
  // Sync router query params if redirected from Seller Management page
  if (route.query.seller) {
    filters.value.seller = route.query.seller as string;
  }

  await Promise.all([
    categoryStore.fetchCategories(),
  ]);

  if (authStore.user?.role === 'admin') {
    try {
      const resp = await adminApi.fetchSellers({ limit: 100 });
      if (resp.success && resp.data) {
        sellersList.value = resp.data.sellers;
      }
    } catch (e) {
      console.error('Failed to load store list for admin filters', e);
    }
  }

  await applyFilters();
});

const validateForm = () => {
  errors.value = {};
  if (!form.value.name.trim()) {
    errors.value.name = 'Product name is required';
  }
  if (!form.value.description.trim()) {
    errors.value.description = 'Description is required';
  } else if (form.value.description.trim().length < 10) {
    errors.value.description = 'Description must be at least 10 characters';
  }
  if (form.value.price === undefined || form.value.price === null || form.value.price <= 0) {
    errors.value.price = 'Price must be greater than 0';
  }
  if (form.value.stock === undefined || form.value.stock === null || form.value.stock < 0) {
    errors.value.stock = 'Stock cannot be negative';
  }
  if (!form.value.categoryId) {
    errors.value.categoryId = 'Category selection is required';
  }
  return Object.keys(errors.value).length === 0;
};

const openCreate = () => {
  editingId.value = null;
  form.value = emptyForm();
  imagesInput.value = '';
  errors.value = {};
  showModal.value = true;
};

const openEdit = (product: any) => {
  editingId.value = product._id;
  form.value = {
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    categoryId: product.categoryId?._id || product.categoryId,
    images: product.images || [],
    status: product.status,
  };
  imagesInput.value = (product.images || []).join(', ');
  errors.value = {};
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingId.value = null;
  errors.value = {};
};

const handleSave = async () => {
  if (!validateForm()) {
    toastStore.error('Please resolve form validation errors.');
    return;
  }

  form.value.images = imagesInput.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  saving.value = true;
  try {
    if (editingId.value) {
      await productStore.updateProduct(editingId.value, form.value);
      toastStore.success('Product updated successfully.');
    } else {
      await productStore.createProduct(form.value);
      toastStore.success('Product created successfully.');
    }
    closeModal();
    applyFilters();
  } catch (err: any) {
    toastStore.error(err.response?.data?.message || 'Failed to save product.');
  } finally {
    saving.value = false;
  }
};

// Confirmation Dialog helpers
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

const handleDeleteProduct = (product: any) => {
  openConfirm(
    'Delete Product',
    `Are you sure you want to delete "${product.name}"? This action cannot be undone and will remove it permanently.`,
    'danger',
    async () => {
      try {
        await productStore.deleteProduct(product._id);
        toastStore.success('Product deleted successfully.');
      } catch (err: any) {
        toastStore.error(err.response?.data?.message || 'Failed to delete product.');
        throw err;
      }
    }
  );
};

// "Hide" action: Transitions product status to draft/archived
const handleHideProduct = (product: any) => {
  openConfirm(
    'Hide Product',
    `Are you sure you want to hide "${product.name}"? It will be saved as a draft and removed from customer catalog.`,
    'warning',
    async () => {
      try {
        await productStore.updateProduct(product._id, { status: 'draft' });
        toastStore.success('Product hidden successfully.');
        applyFilters();
      } catch (err: any) {
        toastStore.error(err.response?.data?.message || 'Failed to hide product.');
        throw err;
      }
    }
  );
};

// "Restore" action: Transitions product status to active
const handleRestoreProduct = (product: any) => {
  openConfirm(
    'Restore Product',
    `Are you sure you want to restore "${product.name}"? It will become active and visible in customer catalog.`,
    'primary',
    async () => {
      try {
        await productStore.updateProduct(product._id, { status: 'active' });
        toastStore.success('Product restored successfully.');
        applyFilters();
      } catch (err: any) {
        toastStore.error(err.response?.data?.message || 'Failed to restore product.');
        throw err;
      }
    }
  );
};

const statusLabel: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  archived: 'Archived',
};
</script>

<template>
  <div class="admin-products-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-row">
        <div>
          <span class="page-eyebrow">ADMIN STUDIO</span>
          <h1 class="page-title">Product Management</h1>
        </div>
        <div class="header-actions">
          <BaseButton
            v-if="authStore.user?.role === 'admin'"
            variant="secondary"
            @click="router.push({ name: 'admin-categories' })"
            id="go-categories-btn"
          >
            Manage Categories
          </BaseButton>
          <BaseButton variant="primary" @click="openCreate" id="add-product-btn">
            <Plus class="btn-icon" /> New Product
          </BaseButton>
        </div>
      </div>
    </header>

    <!-- Filters Panel Toolbar -->
    <section class="filters-toolbar-card">
      <div class="toolbar-title-wrap">
        <SlidersHorizontal class="toolbar-icon" />
        <h3>Query Filters</h3>
      </div>
      
      <div class="filters-grid-inputs">
        <!-- Search -->
        <div class="filter-input-group">
          <label>Search Keyword</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search by name..."
            class="input-box"
          />
        </div>

        <!-- Category -->
        <div class="filter-input-group">
          <label>Category</label>
          <BaseSelect
            v-model="filters.categoryId"
            :options="categoryOptions"
            placeholder="All Categories"
          />
        </div>

        <!-- Seller (Admin Only) -->
        <div v-if="authStore.user?.role === 'admin'" class="filter-input-group">
          <label>Seller Partner</label>
          <BaseSelect
            v-model="filters.seller"
            :options="sellerOptions"
            placeholder="All Sellers"
          />
        </div>

        <!-- Stock Status -->
        <div class="filter-input-group">
          <label>Stock Status</label>
          <BaseSelect
            v-model="filters.stockStatus"
            :options="stockStatusOptions"
            placeholder="All Stock Levels"
          />
        </div>

        <!-- Product Status -->
        <div class="filter-input-group">
          <label>Catalog Status</label>
          <BaseSelect
            v-model="filters.status"
            :options="productStatusOptions"
            placeholder="All Statuses"
          />
        </div>

        <!-- Price Range -->
        <div class="filter-input-group double-inputs">
          <label>Price Range ($)</label>
          <div class="range-inputs-wrap">
            <input
              v-model.number="filters.minPrice"
              type="number"
              placeholder="Min"
              min="0"
              class="input-box small-input"
            />
            <span class="range-divider">-</span>
            <input
              v-model.number="filters.maxPrice"
              type="number"
              placeholder="Max"
              min="0"
              class="input-box small-input"
            />
          </div>
        </div>
      </div>

      <div class="toolbar-actions">
        <button type="button" class="reset-filters-btn" @click="resetFilters">
          Reset Filter Query
        </button>
      </div>
    </section>

    <!-- BaseTable Component Composition -->
    <BaseTable
      :headers="tableHeaders"
      :items="productStore.products"
      :loading="productStore.loading"
      emptyText="No Products Found Matching Criteria"
    >
      <!-- Cell: Image -->
      <template #cell(images)="{ item }">
        <div class="product-thumb-cell">
          <img
            v-if="item.images?.[0]"
            :src="item.images[0]"
            :alt="item.name"
            class="product-thumb"
          />
          <div v-else class="product-thumb-placeholder">
            <Package class="placeholder-icon" />
          </div>
        </div>
      </template>

      <!-- Cell: Name -->
      <template #cell(name)="{ item }">
        <div class="product-info-cell">
          <span class="product-name-title">{{ item.name }}</span>
          <span class="product-id-subtitle">ID: {{ item._id.substring(0, 10) }}...</span>
        </div>
      </template>

      <!-- Cell: Seller (Admin Only) -->
      <template #cell(seller)="{ item }">
        <span class="seller-name-cell">{{ item.seller?.fullName || '—' }}</span>
      </template>

      <!-- Cell: Category -->
      <template #cell(categoryId)="{ item }">
        {{ item.categoryId?.name || '—' }}
      </template>

      <!-- Cell: Price -->
      <template #cell(price)="{ item }">
        <strong>${{ item.price.toFixed(2) }}</strong>
      </template>

      <!-- Cell: Stock -->
      <template #cell(stock)="{ item }">
        <span :class="['stock-number', item.stock === 0 ? 'stock-out' : item.stock <= 5 ? 'stock-low' : '']">
          {{ item.stock }}
        </span>
      </template>

      <!-- Cell: Status -->
      <template #cell(status)="{ item }">
        <span :class="['status-badge', `status-badge--${item.status}`]">
          {{ statusLabel[item.status] }}
        </span>
      </template>

      <!-- Cell: Actions -->
      <template #cell(actions)="{ item }">
        <div class="actions-wrapper">
          <button
            class="action-btn view-btn"
            @click="router.push({ name: 'product-detail', params: { id: item._id } })"
            :aria-label="`View ${item.name}`"
            title="View product details"
          >
            <Eye class="action-icon" />
          </button>
          
          <button
            class="action-btn edit-btn"
            @click="openEdit(item)"
            :aria-label="`Edit ${item.name}`"
            title="Edit product details"
          >
            <Pencil class="action-icon" />
          </button>

          <!-- Hide (Bypasses for draft conversion) -->
          <button
            v-if="item.status === 'active'"
            class="action-btn hide-btn"
            @click="handleHideProduct(item)"
            title="Hide product listing"
          >
            <ShieldAlert class="action-icon" />
          </button>

          <!-- Restore (Bypasses for active reactivation) -->
          <button
            v-else
            class="action-btn restore-btn"
            @click="handleRestoreProduct(item)"
            title="Activate/Restore listing"
          >
            <RotateCcw class="action-icon" />
          </button>

          <button
            class="action-btn delete-btn"
            @click="handleDeleteProduct(item)"
            :aria-label="`Delete ${item.name}`"
            title="Delete product permanently"
          >
            <Trash2 class="action-icon" />
          </button>
        </div>
      </template>

      <!-- Empty Slot Override -->
      <template #empty>
        <div class="empty-state-container">
          <Package class="empty-state-icon" />
          <h3>No products matching queries</h3>
          <p>Try resetting the category, seller, or stock limits to show other products.</p>
        </div>
      </template>
    </BaseTable>

    <!-- Create / Edit Product Modal -->
    <BaseModal :show="showModal" :title="modalTitle" size="lg" @close="closeModal">
      <form @submit.prevent="handleSave" id="product-form">
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label class="form-label" for="prod-name">Product Name *</label>
            <input
              id="prod-name"
              v-model="form.name"
              type="text"
              :class="['form-input', { 'form-input--error': errors.name }]"
              placeholder="e.g. Signature Chronograph Watch"
              required
            />
            <span v-if="errors.name" class="error-msg">{{ errors.name }}</span>
          </div>

          <div class="form-group form-group--full">
            <label class="form-label" for="prod-desc">Description *</label>
            <textarea
              id="prod-desc"
              v-model="form.description"
              :class="['form-textarea', { 'form-textarea--error': errors.description }]"
              placeholder="Detailed product description..."
              rows="4"
              required
            ></textarea>
            <span v-if="errors.description" class="error-msg">{{ errors.description }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="prod-price">Price ($) *</label>
            <input
              id="prod-price"
              v-model.number="form.price"
              type="number"
              min="0"
              step="0.01"
              :class="['form-input', { 'form-input--error': errors.price }]"
              required
            />
            <span v-if="errors.price" class="error-msg">{{ errors.price }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="prod-stock">Stock *</label>
            <input
              id="prod-stock"
              v-model.number="form.stock"
              type="number"
              min="0"
              :class="['form-input', { 'form-input--error': errors.stock }]"
              required
            />
            <span v-if="errors.stock" class="error-msg">{{ errors.stock }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="prod-category">Category *</label>
            <select
              id="prod-category"
              v-model="form.categoryId"
              :class="['form-input', { 'form-input--error': errors.categoryId }]"
              required
            >
              <option value="" disabled>Select a category</option>
              <option v-for="cat in categoryStore.categories" :key="cat._id" :value="cat._id">
                {{ cat.name }}
              </option>
            </select>
            <span v-if="errors.categoryId" class="error-msg">{{ errors.categoryId }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="prod-status">Status</label>
            <select id="prod-status" v-model="form.status" class="form-input">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div class="form-group form-group--full">
            <label class="form-label" for="prod-images">Image URLs <span class="label-hint">(comma-separated)</span></label>
            <input
              id="prod-images"
              v-model="imagesInput"
              type="text"
              class="form-input"
              placeholder="https://img1.jpg, https://img2.jpg"
            />
          </div>

          <!-- Image preview strip -->
          <div v-if="imagesInput.trim()" class="form-group form-group--full">
            <div class="image-preview-strip">
              <img
                v-for="(url, i) in imagesInput.split(',').map(s => s.trim()).filter(Boolean)"
                :key="i"
                :src="url"
                alt="Preview"
                class="preview-thumb"
                @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')"
              />
            </div>
          </div>
        </div>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="closeModal">Cancel</BaseButton>
        <BaseButton
          variant="primary"
          type="submit"
          form="product-form"
          :disabled="saving"
          @click="handleSave"
          id="save-product-btn"
        >
          {{ saving ? 'Saving...' : (editingId ? 'Update Product' : 'Create Product') }}
        </BaseButton>
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
.admin-products-page {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 32px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
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
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Filters Toolbar */
.filters-toolbar-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-soft);
  box-sizing: border-box;
}

.toolbar-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.toolbar-icon {
  width: 18px;
  height: 18px;
  color: var(--color-accent);
}

.toolbar-title-wrap h3 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
}

.filters-grid-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.filter-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-input-group label {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
}

.input-box {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  background-color: var(--color-bg);
  color: var(--color-text);
  box-sizing: border-box;
}

.input-box:focus {
  outline: none;
  border-color: var(--color-accent);
}

.double-inputs {
  grid-column: span 1;
}

.range-inputs-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.small-input {
  width: 45%;
}

.range-divider {
  color: var(--color-muted);
}

.toolbar-actions {
  display: flex;
  justify-content: flex-end;
}

.reset-filters-btn {
  background: none;
  border: 1px solid var(--color-border);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-filters-btn:hover {
  background-color: var(--color-bg-alt);
}

/* Image Cell */
.product-thumb-cell {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-thumb-placeholder {
  color: var(--color-muted);
}

.placeholder-icon {
  width: 20px;
  height: 20px;
}

/* Info Cell */
.product-info-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-name-title {
  font-weight: 700;
  color: var(--color-text);
}

.product-id-subtitle {
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
  color: var(--color-muted);
}

.seller-name-cell {
  font-weight: 600;
}

/* Stock Cell formatting */
.stock-number {
  font-weight: 700;
  color: var(--color-text);
}

.stock-out {
  color: var(--color-danger);
}

.stock-low {
  color: var(--color-warning);
}

/* Status Badge */
.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-transform: capitalize;
  display: inline-block;
}

.status-badge--active {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge--draft {
  background-color: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.status-badge--archived {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

/* Actions */
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

.delete-btn:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
  background-color: rgba(229, 72, 77, 0.05);
}

.hide-btn:hover {
  border-color: var(--color-warning);
  color: var(--color-warning);
  background-color: rgba(245, 158, 11, 0.05);
}

.restore-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: rgba(23, 20, 63, 0.05);
}

.action-icon {
  width: 14px;
  height: 14px;
}

/* Form Styles */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group--full {
  grid-column: span 2;
}

.form-label {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text);
}

.form-input, select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  background-color: var(--color-bg);
  color: var(--color-text);
  box-sizing: border-box;
}

.form-input:focus, select:focus {
  outline: none;
  border-color: var(--color-accent);
}

.form-input--error, select--error {
  border-color: var(--color-danger) !important;
}

.error-msg {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--color-danger);
  margin-top: 2px;
}

.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  background-color: var(--color-bg);
  color: var(--color-text);
  box-sizing: border-box;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

.form-textarea--error {
  border-color: var(--color-danger) !important;
}

.label-hint {
  font-weight: 400;
  color: var(--color-muted);
}

.image-preview-strip {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 0;
}

.preview-thumb {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  border: 1px solid var(--color-border);
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
  text-align: center;
}

.empty-state-icon {
  width: 48px;
  height: 48px;
  color: var(--color-muted);
  opacity: 0.5;
  margin-bottom: 8px;
}

.empty-state-container h3 {
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
}

/* Responsive grid scales */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .form-group--full {
    grid-column: span 1;
  }
  .double-inputs {
    grid-column: span 1;
  }
}
</style>
