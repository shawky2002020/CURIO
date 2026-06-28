<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useCategoryStore } from '../../../stores/category.store.js';
import { useToastStore } from '../../../stores/toast.store.js';
import type { CreateCategoryPayload } from '../../../types/product.types.js';
import BaseButton from '../../../components/ui/BaseButton.vue';
import { Plus, Pencil, Trash2, Tag } from '@lucide/vue';
import { useAuthStore } from '../../../stores/auth.store.js';
import { useRouter } from 'vue-router';
const categoryStore = useCategoryStore();
const toastStore = useToastStore();

// Modal state
const showModal = ref(false);
const editingId = ref<string | null>(null);
const form = ref<CreateCategoryPayload>({ name: '', description: '', imageUrl: '' });
const saving = ref(false);
const authStore = useAuthStore();
const router = useRouter();


const modalTitle = computed(() => (editingId.value ? 'New Category' : 'New Category'));

onMounted(async () => {
  await categoryStore.fetchCategories();
});

const openCreate = () => {
  editingId.value = null;
  form.value = { name: '', description: '', imageUrl: '' };
  showModal.value = true;
};

const openEdit = (cat: any) => {
  editingId.value = cat._id;
  form.value = { name: cat.name, description: cat.description || '', imageUrl: cat.imageUrl || '' };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingId.value = null;
};

const handleSave = async () => {
  if (!form.value.name.trim()) return;
  saving.value = true;
  try {
    if (editingId.value) {
      await categoryStore.updateCategory(editingId.value, form.value);
      toastStore.success('Category updated successfully.');
    } else {
      await categoryStore.createCategory(form.value);
      toastStore.success('Category created successfully.');
    }
    closeModal();
  } catch (err: any) {
    toastStore.error(err.response?.data?.message || 'Failed to save category.');
  } finally {
    saving.value = false;
  }
};

const showDeleteConfirm = ref(false);
const catToDelete = ref<any | null>(null);

const openDeleteConfirm = (cat: any) => {
  catToDelete.value = cat;
  showDeleteConfirm.value = true;
};

const closeDeleteConfirm = () => {
  catToDelete.value = null;
  showDeleteConfirm.value = false;
};

const executeDelete = async () => {
  if (!catToDelete.value) return;
  try {
    await categoryStore.deleteCategory(catToDelete.value._id);
    toastStore.success('Category deleted successfully.');
    closeDeleteConfirm();
  } catch (err: any) {
    toastStore.error(err.response?.data?.message || 'Failed to delete category.');
  }
};
</script>

<template>
  <div class="admin-view">
    <!-- Header -->
    <header class="page-header">
      <div class="header-row">
        <div>
          <span class="page-eyebrow">ADMIN STUDIO</span>
          <h1 class="page-title">Category Management</h1>
        </div>

        <div class="header-actions">
          <BaseButton v-if="authStore.user?.role === 'admin'" variant="secondary"
            @click="router.push({ name: 'admin-products' })" id="go-categories-btn">
            Manage Products
          </BaseButton>
          <BaseButton variant="primary" @click="openCreate" id="add-category-btn">
            <Plus class="btn-icon" /> New Category
          </BaseButton>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="categoryStore.loading" class="table-loading">
      <div v-for="n in 4" :key="n" class="skeleton-row motion-shimmer"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="categoryStore.categories.length === 0" class="empty-state">
      <Tag class="empty-icon" />
      <h3>No categories yet</h3>
      <p>Create your first category to start organizing products.</p>
    </div>

    <!-- Category Table -->
    <div v-else class="table-wrapper">
      <table class="data-table" aria-label="Categories list">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categoryStore.categories" :key="cat._id" class="table-row">
            <td>
              <div class="cat-image-cell">
                <img v-if="cat.imageUrl" :src="cat.imageUrl" :alt="cat.name" class="cat-thumb" />
                <span v-else class="cat-thumb-placeholder">
                  <Tag class="placeholder-icon" />
                </span>
              </div>
            </td>
            <td class="name-cell">{{ cat.name }}</td>
            <td class="mono-cell">{{ cat.slug }}</td>
            <td class="desc-cell">{{ cat.description || '—' }}</td>
            <td class="actions-cell">
              <div class="actions-wrapper">
                <button class="action-btn edit-btn" @click="openEdit(cat)" :aria-label="`Edit ${cat.name}`">
                  <Pencil class="action-icon" />
                </button>
                <button class="action-btn delete-btn" @click="openDeleteConfirm(cat)"
                  :aria-label="`Delete ${cat.name}`">
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

          <div class="form-group">
            <label class="form-label" for="cat-name">Category Name *</label>
            <input id="cat-name" v-model="form.name" type="text" class="form-input" placeholder="e.g. Leather Goods" />
          </div>

          <div class="form-group">
            <label class="form-label" for="cat-desc">Description</label>
            <textarea id="cat-desc" v-model="form.description" class="form-textarea" placeholder="Brief description..."
              rows="3"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="cat-image">Image URL</label>
            <input id="cat-image" v-model="form.imageUrl" type="url" class="form-input" placeholder="https://..." />
          </div>

          <div class="modal-actions">
            <BaseButton variant="secondary" @click="closeModal">Cancel</BaseButton>
            <BaseButton variant="primary" :disabled="saving || !form.name.trim()" @click="handleSave"
              id="save-category-btn">
              {{ saving ? 'Saving...' : (editingId ? 'Update' : 'Create') }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="closeDeleteConfirm" role="dialog"
        aria-label="Confirm Deletion">
        <div class="modal-card modal-card--sm motion-scale-in">
          <h2 class="modal-title">Delete Category</h2>
          <p class="delete-warning-text">
            Are you sure you want to delete <strong>{{ catToDelete?.name }}</strong>? This action cannot be undone and
            will remove it permanently.
          </p>
          <div class="modal-actions">
            <BaseButton variant="secondary" @click="closeDeleteConfirm">Cancel</BaseButton>
            <BaseButton variant="primary" class="btn--danger" @click="executeDelete" id="confirm-delete-category-btn">
              Delete Category
            </BaseButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-view {
  width: 100%;
}

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

/* Table */
.table-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-row {
  height: 60px;
  border-radius: var(--radius-md);
}

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

.empty-icon {
  width: 40px;
  height: 40px;
  color: var(--color-muted);
}

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
  border-radius: var(--radius-lg);
}

.data-table thead {
  background-color: var(--color-bg-alt);
}

.data-table th {
  text-align: left;
  padding: 14px 20px;
  font-family: var(--font-display);
  font-size: 0.78rem;
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

.table-row:hover {
  background-color: var(--color-bg-alt);
}

.table-row:last-child {
  border-bottom: none;
}

.data-table td {
  padding: 14px 20px;
  color: var(--color-text);
  vertical-align: middle;
}

.cat-image-cell {
  width: 52px;
}

.cat-thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  border: 1px solid var(--color-border);
}

.cat-thumb-placeholder {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  width: 20px;
  height: 20px;
  color: var(--color-muted);
}

.name-cell {
  font-weight: 700;
  color: var(--color-primary);
}

.mono-cell {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-muted);
}

.desc-cell {
  color: var(--color-muted);
  max-width: 260px;
}

.actions-cell {
  vertical-align: middle;
}

.actions-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.8rem;
  transition: all var(--duration-fast) var(--ease-spring);
}

.action-icon {
  width: 14px;
  height: 14px;
}

.edit-btn {
  background-color: var(--color-bg-alt);
  color: var(--color-primary);
}

.edit-btn:hover {
  background-color: var(--color-primary);
  color: white;
}

.delete-btn {
  background-color: rgba(229, 72, 77, 0.08);
  color: var(--color-danger);
}

.delete-btn:hover {
  background-color: var(--color-danger);
  color: white;
}

.delete-btn--confirm {
  background-color: var(--color-danger);
  color: white;
}

.header-actions {
  display: flex;
  gap: 12px;
}

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
}

.modal-card {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 40px;
  width: 100%;
  max-width: 520px;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-primary);
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

.form-textarea {
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
