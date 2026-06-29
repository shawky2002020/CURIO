<script setup lang="ts">
/**
 * AdminCategoriesPage
 * Administrative Category Management dashboard supporting Create, Read, Update, Delete,
 * and Restoration, composed using BaseTable, BaseModal, and BaseConfirmDialog.
 */
import { ref, onMounted, computed } from 'vue';
import { useCategoryStore } from '../../../stores/category.store.js';
import { useToastStore } from '../../../stores/toast.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';
import { useRouter } from 'vue-router';
import type { CreateCategoryPayload } from '../../../types/product.types.js';
import { Plus, Pencil, Trash2, Tag, RotateCcw } from '@lucide/vue';
import BaseButton from '../../../components/ui/BaseButton.vue';

// UI Base Components
import BaseTable from '../../../components/ui/BaseTable.vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BaseConfirmDialog from '../../../components/ui/BaseConfirmDialog.vue';

const categoryStore = useCategoryStore();
const toastStore = useToastStore();
const authStore = useAuthStore();
const router = useRouter();

// Table configuration headers
const tableHeaders = [
  { key: 'imageUrl', label: 'Image', width: '80px' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
];

// Modal / Dialog States
const showModal = ref(false);
const editingId = ref<string | null>(null);
const form = ref<CreateCategoryPayload>({ name: '', description: '', imageUrl: '' });
const saving = ref(false);

const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');
const confirmDialogVariant = ref<'primary' | 'danger' | 'warning'>('primary');
const confirmDialogLoading = ref(false);
const onConfirmCallback = ref<(() => Promise<void>) | null>(null);

const modalTitle = computed(() => (editingId.value ? 'Edit Category' : 'New Category'));

onMounted(async () => {
  // Fetch all categories including soft-deleted ones for administration
  await categoryStore.fetchCategories(true);
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
    // Refresh to ensure status and other properties show up correctly
    await categoryStore.fetchCategories(true);
  } catch (err: any) {
    toastStore.error(err.response?.data?.message || 'Failed to save category.');
  } finally {
    saving.value = false;
  }
};

// Confirmation Overlay Orchestrator
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
      // Errors handled inside callback
    } finally {
      confirmDialogLoading.value = false;
      onConfirmCallback.value = null;
    }
  }
};

const handleConfirmDialogCancel = () => {
  onConfirmCallback.value = null;
};

const handleDeleteCategory = (cat: any) => {
  openConfirm(
    'Delete Category',
    `Are you sure you want to soft delete the category "${cat.name}"? Active products in this category may become uncategorized.`,
    'danger',
    async () => {
      try {
        await categoryStore.deleteCategory(cat._id);
        toastStore.success('Category deleted successfully.');
      } catch (err: any) {
        toastStore.error(err.response?.data?.message || 'Failed to delete category.');
        throw err;
      }
    }
  );
};

const handleRestoreCategory = (cat: any) => {
  openConfirm(
    'Restore Category',
    `Are you sure you want to restore the category "${cat.name}"? This will make it active and visible to buyers again.`,
    'primary',
    async () => {
      try {
        await categoryStore.restoreCategory(cat._id);
        toastStore.success('Category restored successfully.');
      } catch (err: any) {
        toastStore.error(err.response?.data?.message || 'Failed to restore category.');
        throw err;
      }
    }
  );
};
</script>

<template>
  <div class="admin-categories-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-row">
        <div>
          <span class="page-eyebrow">ADMIN STUDIO</span>
          <h1 class="page-title">Category Management</h1>
        </div>

        <div class="header-actions">
          <BaseButton
            v-if="authStore.user?.role === 'admin'"
            variant="secondary"
            @click="router.push({ name: 'admin-products' })"
            id="go-products-btn"
          >
            Manage Products
          </BaseButton>
          <BaseButton variant="primary" @click="openCreate" id="add-category-btn">
            <Plus class="btn-icon" /> New Category
          </BaseButton>
        </div>
      </div>
    </header>

    <!-- Table Composition -->
    <BaseTable
      :headers="tableHeaders"
      :items="categoryStore.categories"
      :loading="categoryStore.loading"
      emptyText="No Categories Found"
    >
      <!-- Cell: Image -->
      <template #cell(imageUrl)="{ item }">
        <div class="cat-image-cell">
          <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="cat-thumb" />
          <span v-else class="cat-thumb-placeholder">
            <Tag class="placeholder-icon" />
          </span>
        </div>
      </template>

      <!-- Cell: Name -->
      <template #cell(name)="{ item }">
        <span class="name-text">{{ item.name }}</span>
      </template>

      <!-- Cell: Slug -->
      <template #cell(slug)="{ item }">
        <span class="mono-text">{{ item.slug }}</span>
      </template>

      <!-- Cell: Description -->
      <template #cell(description)="{ item }">
        <span class="desc-text">{{ item.description || '—' }}</span>
      </template>

      <!-- Cell: Status -->
      <template #cell(status)="{ item }">
        <span
          class="status-badge"
          :class="`status-badge--${item.status || 'active'}`"
        >
          {{ item.status || 'active' }}
        </span>
      </template>

      <!-- Cell: Actions -->
      <template #cell(actions)="{ item }">
        <div class="actions-wrapper">
          <button class="action-btn edit-btn" @click="openEdit(item)" :aria-label="`Edit ${item.name}`">
            <Pencil class="action-icon" />
          </button>
          
          <button
            v-if="item.status !== 'deleted'"
            class="action-btn delete-btn"
            @click="handleDeleteCategory(item)"
            :aria-label="`Delete ${item.name}`"
          >
            <Trash2 class="action-icon" />
          </button>

          <button
            v-else
            class="action-btn restore-btn"
            @click="handleRestoreCategory(item)"
            :aria-label="`Restore ${item.name}`"
            title="Restore Category"
          >
            <RotateCcw class="action-icon" />
          </button>
        </div>
      </template>

      <!-- Custom Empty State -->
      <template #empty>
        <div class="empty-state-container">
          <Tag class="empty-state-icon" />
          <h3>No categories found</h3>
          <p>Create your first category to start organizing products.</p>
        </div>
      </template>
    </BaseTable>

    <!-- Create / Edit Modal Dialog -->
    <BaseModal :show="showModal" :title="modalTitle" @close="closeModal">
      <form @submit.prevent="handleSave" id="category-form">
        <div class="form-inputs-wrap">
          <div class="input-group">
            <label class="form-label" for="cat-name">Category Name *</label>
            <input
              id="cat-name"
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="e.g. Leather Goods"
              required
            />
          </div>

          <div class="input-group">
            <label class="form-label" for="cat-desc">Description</label>
            <textarea
              id="cat-desc"
              v-model="form.description"
              class="form-textarea"
              placeholder="Brief description..."
              rows="3"
            ></textarea>
          </div>

          <div class="input-group">
            <label class="form-label" for="cat-image">Image URL</label>
            <input
              id="cat-image"
              v-model="form.imageUrl"
              type="url"
              class="form-input"
              placeholder="https://..."
            />
          </div>
        </div>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="closeModal">Cancel</BaseButton>
        <BaseButton
          variant="primary"
          type="submit"
          form="category-form"
          :disabled="saving || !form.name.trim()"
          id="save-category-btn"
        >
          {{ saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Category') }}
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
.admin-categories-page {
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

/* Category Image Cell */
.cat-image-cell {
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

.cat-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cat-thumb-placeholder {
  color: var(--color-muted);
}

.placeholder-icon {
  width: 20px;
  height: 20px;
}

.name-text {
  font-weight: 700;
  color: var(--color-text);
}

.mono-text {
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
  color: var(--color-muted);
}

.desc-text {
  color: var(--color-muted);
  max-width: 400px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* Status badge */
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

.status-badge--deleted {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
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

.restore-btn:hover {
  border-color: var(--color-success);
  color: var(--color-success);
  background-color: rgba(22, 163, 74, 0.05);
}

.action-icon {
  width: 14px;
  height: 14px;
}

/* Form layout */
.form-inputs-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text);
}

.form-input {
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

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
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
</style>
