<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useProductStore } from '../../../stores/product.store.js';
import { useCategoryStore } from '../../../stores/category.store.js';
import { useToastStore } from '../../../stores/toast.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';
import type { CreateProductPayload } from '../../../types/product.types.js';
import StarRating from '../../catalog/components/StarRating.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import { Plus, Pencil, Trash2, Package, Eye } from '@lucide/vue';
import { useRouter } from 'vue-router';

const productStore = useProductStore();
const categoryStore = useCategoryStore();
const toastStore = useToastStore();
const authStore = useAuthStore();
const router = useRouter();

// Modal state
const showModal = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const imagesInput = ref(''); // comma-separated URLs

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

onMounted(async () => {
  await Promise.all([productStore.fetchProducts(), categoryStore.fetchCategories()]);
});

// Sellers see only their own, admins see all
const visibleProducts = computed(() => {
  if (authStore.user?.role === 'admin') return productStore.products;
  return productStore.products.filter((p) => p.seller?._id === authStore.user?.id);
});

const errors = ref<Record<string, string>>({});

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

  // Parse comma-separated image URLs
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
  } catch (err: any) {
    toastStore.error(err.response?.data?.message || 'Failed to save product.');
  } finally {
    saving.value = false;
  }
};

const showDeleteConfirm = ref(false);
const productToDelete = ref<any | null>(null);

const openDeleteConfirm = (product: any) => {
  productToDelete.value = product;
  showDeleteConfirm.value = true;
};

const closeDeleteConfirm = () => {
  productToDelete.value = null;
  showDeleteConfirm.value = false;
};

const executeDelete = async () => {
  if (!productToDelete.value) return;
  try {
    await productStore.deleteProduct(productToDelete.value._id);
    toastStore.success('Product deleted successfully.');
    closeDeleteConfirm();
  } catch (err: any) {
    toastStore.error(err.response?.data?.message || 'Failed to delete product.');
  }
};

const statusLabel: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  archived: 'Archived',
};
</script>

<template>
  <div class="admin-view">
    <!-- Header -->
    <header class="page-header">
      <div class="header-row">
        <div>
          <span class="page-eyebrow">ADMIN STUDIO</span>
          <h1 class="page-title">Product Management</h1>
        </div>
        <div class="header-actions">
          <BaseButton v-if="authStore.user?.role === 'admin'" variant="secondary" @click="router.push({ name: 'admin-categories' })" id="go-categories-btn">
            Manage Categories
          </BaseButton>
          <BaseButton variant="primary" @click="openCreate" id="add-product-btn">
            <Plus class="btn-icon" /> New Product
          </BaseButton>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="productStore.loading" class="table-loading">
      <div v-for="n in 5" :key="n" class="skeleton-row motion-shimmer"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="visibleProducts.length === 0" class="empty-state">
      <Package class="empty-icon" />
      <h3>No products yet</h3>
      <p>Create your first product to populate the catalog.</p>
    </div>

    <!-- Products Table -->
    <div v-else class="table-wrapper">
      <table class="data-table" aria-label="Products list">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Rating</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in visibleProducts" :key="product._id" class="table-row">
            <td>
              <div class="product-thumb-cell">
                <img
                  v-if="product.images?.[0]"
                  :src="product.images[0]"
                  :alt="product.name"
                  class="product-thumb"
                />
                <div v-else class="product-thumb-placeholder">
                  <Package class="placeholder-icon" />
                </div>
              </div>
            </td>
            <td class="name-cell">
              <span class="product-name">{{ product.name }}</span>
              <span class="product-id">{{ product._id.substring(0, 10) }}...</span>
            </td>
            <td class="category-cell">{{ product.categoryId?.name || '—' }}</td>
            <td class="price-cell">${{ product.price.toFixed(2) }}</td>
            <td :class="['stock-cell', product.stock === 0 ? 'stock-cell--out' : '']">{{ product.stock }}</td>
            <td>
              <StarRating v-if="product.reviewCount > 0" :rating="product.averageRating" size="sm" />
              <span v-else class="no-rating">—</span>
            </td>
            <td>
              <span :class="['status-badge', `status-badge--${product.status}`]">
                {{ statusLabel[product.status] }}
              </span>
            </td>
            <td class="actions-cell">
              <div class="actions-wrapper">
                <button
                  class="action-btn view-btn"
                  @click="router.push({ name: 'product-detail', params: { id: product._id } })"
                  :aria-label="`View ${product.name}`"
                >
                  <Eye class="action-icon" />
                </button>
                <button class="action-btn edit-btn" @click="openEdit(product)" :aria-label="`Edit ${product.name}`">
                  <Pencil class="action-icon" />
                </button>
                <button
                  class="action-btn delete-btn"
                  @click="openDeleteConfirm(product)"
                  :aria-label="`Delete ${product.name}`"
                >
                  <Trash2 class="action-icon" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal" role="dialog" :aria-label="modalTitle">
        <div class="modal-card motion-scale-in">
          <h2 class="modal-title">{{ modalTitle }}</h2>

          <div class="form-grid">
            <div class="form-group form-group--full">
              <label class="form-label" for="prod-name">Product Name *</label>
              <input
                id="prod-name"
                v-model="form.name"
                type="text"
                :class="['form-input', { 'form-input--error': errors.name }]"
                placeholder="e.g. Signature Chronograph Watch"
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
              />
              <span v-if="errors.stock" class="error-msg">{{ errors.stock }}</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="prod-category">Category *</label>
              <select
                id="prod-category"
                v-model="form.categoryId"
                :class="['form-input', { 'form-input--error': errors.categoryId }]"
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

          <div class="modal-actions">
            <BaseButton variant="secondary" @click="closeModal">Cancel</BaseButton>
            <BaseButton
              variant="primary"
              :disabled="saving"
              @click="handleSave"
              id="save-product-btn"
            >
              {{ saving ? 'Saving...' : (editingId ? 'Update Product' : 'Create Product') }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="closeDeleteConfirm" role="dialog" aria-label="Confirm Deletion">
        <div class="modal-card modal-card--sm motion-scale-in">
          <h2 class="modal-title">Delete Product</h2>
          <p class="delete-warning-text">
            Are you sure you want to delete <strong>{{ productToDelete?.name }}</strong>? This action cannot be undone and will remove it permanently.
          </p>
          <div class="modal-actions">
            <BaseButton variant="secondary" @click="closeDeleteConfirm">Cancel</BaseButton>
            <BaseButton variant="primary" class="btn--danger" @click="executeDelete" id="confirm-delete-product-btn">
              Delete Product
            </BaseButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-view { width: 100%; }

.page-header {
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 2px solid var(--color-border);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.btn-icon {
  width: 16px;
  height: 16px;
  display: inline-block;
  vertical-align: -3px;
  margin-right: 6px;
}

/* Loading */
.table-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-row {
  height: 64px;
  border-radius: var(--radius-md);
}

/* Empty */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 40px;
  text-align: center;
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.empty-icon { width: 40px; height: 40px; color: var(--color-muted); }

/* Table */
.table-wrapper {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-border);
  box-shadow: var(--shadow-card);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  background-color: var(--color-surface);
}

.data-table thead { background-color: var(--color-bg-alt); }

.data-table th {
  text-align: left;
  padding: 14px 18px;
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-muted);
  border-bottom: 2px solid var(--color-border);
}

.table-row {
  border-bottom: 1px solid var(--color-border);
  transition: background-color var(--duration-fast) var(--ease-out);
}

.table-row:hover { background-color: var(--color-bg-alt); }
.table-row:last-child { border-bottom: none; }

.data-table td {
  padding: 12px 18px;
  vertical-align: middle;
}

.product-thumb-cell { width: 56px; }

.product-thumb {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  border: 1px solid var(--color-border);
  display: block;
}

.product-thumb-placeholder {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon { width: 20px; height: 20px; color: var(--color-muted); }

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 160px;
}

.product-name { font-weight: 700; color: var(--color-primary); font-size: 0.9rem; }
.product-id { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-muted); }

.category-cell { color: var(--color-muted); }
.price-cell { font-family: var(--font-mono); font-weight: 700; color: var(--color-accent); font-size: 0.95rem; }
.stock-cell { font-family: var(--font-mono); font-weight: 600; }
.stock-cell--out { color: var(--color-danger); }
.no-rating { color: var(--color-muted); }

.status-badge {
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 9999px;
}

.status-badge--active { background-color: rgba(22,163,74,0.1); color: var(--color-success); }
.status-badge--draft { background-color: rgba(245,158,11,0.1); color: var(--color-warning); }
.status-badge--archived { background-color: rgba(102,112,133,0.1); color: var(--color-muted); }

.actions-cell {
  vertical-align: middle;
}

.actions-wrapper {
  display: flex;
  gap: 6px;
  align-items: center;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.78rem;
  transition: all var(--duration-fast) var(--ease-spring);
}

.action-icon { width: 13px; height: 13px; }
.confirm-text { font-size: 0.72rem; }

.view-btn { background-color: var(--color-bg-alt); color: var(--color-primary); }
.view-btn:hover { background-color: var(--color-primary); color: white; }
.edit-btn { background-color: rgba(23,20,63,0.07); color: var(--color-primary); }
.edit-btn:hover { background-color: var(--color-primary); color: white; }
.delete-btn { background-color: rgba(229,72,77,0.08); color: var(--color-danger); }
.delete-btn:hover { background-color: var(--color-danger); color: white; }
.delete-btn--confirm { background-color: var(--color-danger); color: white; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(17, 24, 39, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
  overflow-y: auto;
}

.modal-card {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 40px;
  width: 100%;
  max-width: 640px;
  box-shadow: 0 32px 80px rgba(16, 16, 24, 0.16);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-title {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group--full { grid-column: 1 / -1; }

.form-label {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-primary);
}

.label-hint {
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: 0.8rem;
  color: var(--color-muted);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-alt);
  border: 2px solid var(--color-border);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  box-sizing: border-box;
  transition: border-color var(--duration-base) var(--ease-out);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(15, 61, 94, 0.08);
}

.form-textarea { resize: vertical; }

.image-preview-strip {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px;
  background-color: var(--color-bg-alt);
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
}

.preview-thumb {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  border: 1px solid var(--color-border);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--color-border);
  padding-top: 20px;
}

.form-input--error,
.form-textarea--error {
  border-color: var(--color-danger) !important;
}

.error-msg {
  color: var(--color-danger);
  font-family: var(--font-sans);
  font-size: 0.75rem;
  margin-top: 4px;
  display: block;
}

.modal-card--sm {
  max-width: 460px;
}

.delete-warning-text {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
}

.btn--danger {
  background-color: var(--color-danger) !important;
  color: white !important;
}

.btn--danger:hover {
  background-color: #b91c1c !important;
}
</style>
