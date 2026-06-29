<script setup lang="ts">
/**
 * AdminBannersPage
 * Administrative Homepage Banner management console.
 * Composes BaseTable, BaseModal, BasePagination, and BaseConfirmDialog.
 */
import { ref, onMounted, watch } from 'vue';
import { adminApi, type BannerRegistryItem } from '../../../api/admin.api.js';
import { useToastStore } from '../../../stores/toast.store.js';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Link,
  Image,
} from '@lucide/vue';

// UI Base Components
import BaseTable from '../../../components/ui/BaseTable.vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BasePagination from '../../../components/ui/BasePagination.vue';
import BaseConfirmDialog from '../../../components/ui/BaseConfirmDialog.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseInput from '../../../components/ui/BaseInput.vue';

const toastStore = useToastStore();

const loading = ref(true);
const error = ref<string | null>(null);

const banners = ref<BannerRegistryItem[]>([]);
const totalBanners = ref(0);
const totalPages = ref(1);
const currentPage = ref(1);
const limitPerPage = ref(10);

const search = ref('');

// Table Headers
const tableHeaders = [
  { key: 'image', label: 'Preview', width: '120px' },
  { key: 'title', label: 'Banner Info' },
  { key: 'linkUrl', label: 'Target Link' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '150px' },
];

// Banner Modal state
const showModal = ref(false);
const isEditing = ref(false);
const activeBannerId = ref<string | null>(null);

// Form Fields
const form = ref({
  title: '',
  subtitle: '',
  imageUrl: '',
  linkUrl: '',
  status: 'active' as 'active' | 'inactive',
});

const formErrors = ref<Record<string, string>>({});

// Confirmation Dialog state
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');
const confirmDialogVariant = ref<'primary' | 'danger' | 'warning'>('primary');
const confirmDialogLoading = ref(false);
const onConfirmCallback = ref<(() => Promise<void>) | null>(null);

const fetchBanners = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await adminApi.fetchBanners({
      page: currentPage.value,
      limit: limitPerPage.value,
      search: search.value.trim() || undefined,
    });
    if (response.success && response.data) {
      banners.value = response.data.banners;
      totalBanners.value = response.data.total;
      totalPages.value = response.data.pages;
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to retrieve banners.';
  } finally {
    loading.value = false;
  }
};

// Search Watcher with debouncing
let searchTimeout: any = null;
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchBanners();
  }, 350);
});

onMounted(() => {
  fetchBanners();
});

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchBanners();
};

const openCreateModal = () => {
  isEditing.value = false;
  activeBannerId.value = null;
  formErrors.value = {};
  form.value = {
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    status: 'active',
  };
  showModal.value = true;
};

const openEditModal = (banner: BannerRegistryItem) => {
  isEditing.value = true;
  activeBannerId.value = banner._id;
  formErrors.value = {};
  form.value = {
    title: banner.title,
    subtitle: banner.subtitle || '',
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl || '',
    status: banner.status,
  };
  showModal.value = true;
};

const validateForm = (): boolean => {
  const errors: Record<string, string> = {};
  if (!form.value.title.trim()) {
    errors.title = 'Banner title is required.';
  }

  if (!form.value.imageUrl.trim()) {
    errors.imageUrl = 'Image URL is required.';
  } else {
    const urlRegex = /^(https?:\/\/|\/)[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(form.value.imageUrl.trim())) {
      errors.imageUrl = 'Please provide a valid image URL path.';
    }
  }

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const handleSaveBanner = async () => {
  if (!validateForm()) return;

  try {
    const payload = {
      title: form.value.title.trim(),
      subtitle: form.value.subtitle.trim() || undefined,
      imageUrl: form.value.imageUrl.trim(),
      linkUrl: form.value.linkUrl.trim() || undefined,
      status: form.value.status,
    };

    let response;
    if (isEditing.value && activeBannerId.value) {
      response = await adminApi.updateBanner(activeBannerId.value, payload);
    } else {
      response = await adminApi.createBanner(payload);
    }

    if (response.success) {
      toastStore.success(`Homepage banner ${isEditing.value ? 'updated' : 'created'} successfully.`);
      showModal.value = false;
      fetchBanners();
    }
  } catch (err: any) {
    toastStore.error(err?.response?.data?.message || 'An error occurred while saving the banner.');
  }
};

const handleToggleActive = async (banner: BannerRegistryItem) => {
  const newStatus = banner.status === 'active' ? 'inactive' : 'active';
  try {
    const response = await adminApi.updateBanner(banner._id, { status: newStatus });
    if (response.success) {
      toastStore.success(`Banner has been ${newStatus === 'active' ? 'enabled' : 'disabled'}.`);
      fetchBanners();
    }
  } catch (err: any) {
    toastStore.error(err?.response?.data?.message || 'Failed to update banner status.');
  }
};

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
      // Handled inside callback
    } finally {
      confirmDialogLoading.value = false;
      onConfirmCallback.value = null;
    }
  }
};

const handleDeleteBanner = (banner: BannerRegistryItem) => {
  triggerConfirm(
    'Delete Homepage Banner',
    `Are you sure you want to permanently delete the banner "${banner.title}"? This action cannot be undone.`,
    'danger',
    async () => {
      try {
        const response = await adminApi.deleteBanner(banner._id);
        if (response.success) {
          toastStore.success('Banner deleted successfully.');
          fetchBanners();
        }
      } catch (err: any) {
        toastStore.error(err?.response?.data?.message || 'Failed to delete banner.');
        throw err;
      }
    }
  );
};
</script>

<template>
  <div class="admin-banners-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">Homepage Banner Management</h1>
        <p class="page-subtitle">Configure, reorder, and enable/disable featured collection marketing banners.</p>
      </div>
      <BaseButton variant="primary" @click="openCreateModal">
        <Plus class="btn-icon" /> Create Banner
      </BaseButton>
    </header>

    <!-- Toolbar Filters -->
    <section class="controls-toolbar">
      <div class="search-input-wrap">
        <Search class="search-icon" />
        <input
          v-model="search"
          type="text"
          placeholder="Search banners by title keyword..."
          class="search-input-box"
        />
      </div>
    </section>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <AlertTriangle class="error-icon" />
      <h3>Failed to load banners</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchBanners">Retry</button>
    </div>

    <!-- Banners Table -->
    <template v-else>
      <BaseTable
        :headers="tableHeaders"
        :items="banners"
        :loading="loading"
        emptyText="No Homepage Banners Found"
      >
        <!-- Cell: Image Preview -->
        <template #cell(image)="{ item }">
          <div class="banner-preview-wrap">
            <img :src="item.imageUrl" class="banner-preview-img" alt="Banner" />
          </div>
        </template>

        <!-- Cell: Title/Info -->
        <template #cell(title)="{ item }">
          <div class="banner-info-cell">
            <span class="banner-title-txt">{{ item.title }}</span>
            <span v-if="item.subtitle" class="banner-subtitle-txt">{{ item.subtitle }}</span>
          </div>
        </template>

        <!-- Cell: Link URL -->
        <template #cell(linkUrl)="{ item }">
          <span v-if="item.linkUrl" class="link-label">
            <Link class="link-icon" />
            <span class="link-url-txt">{{ item.linkUrl }}</span>
          </span>
          <span v-else class="text-muted">None (Static Banner)</span>
        </template>

        <!-- Cell: Status -->
        <template #cell(status)="{ item }">
          <button
            class="status-toggle-btn"
            :title="item.status === 'active' ? 'Disable Banner' : 'Enable Banner'"
            @click="handleToggleActive(item)"
          >
            <ToggleRight v-if="item.status === 'active'" class="toggle-icon active-toggle" />
            <ToggleLeft v-else class="toggle-icon inactive-toggle" />
          </button>
        </template>

        <!-- Cell: Actions -->
        <template #cell(actions)="{ item }">
          <div class="actions-buttons">
            <button class="action-btn" title="Edit Banner" @click="openEditModal(item)">
              <Edit class="action-icon" />
            </button>
            <button class="action-btn action-delete" title="Delete Banner" @click="handleDeleteBanner(item)">
              <Trash2 class="action-icon" />
            </button>
          </div>
        </template>
      </BaseTable>

      <BasePagination
        :currentPage="currentPage"
        :totalPages="totalPages"
        @change="handlePageChange"
      />
    </template>

    <!-- MODAL: Banner Creator / Editor -->
    <BaseModal
      :show="showModal"
      :title="isEditing ? 'Edit Homepage Banner' : 'Create Homepage Banner'"
      @close="showModal = false"
    >
      <form @submit.prevent="handleSaveBanner" class="banner-form">
        <div class="form-row">
          <BaseInput
            id="title"
            label="Banner Title / Headline"
            v-model="form.title"
            placeholder="e.g. Modernist Collection"
            :error="formErrors.title"
            required
          />
        </div>

        <div class="form-row">
          <BaseInput
            id="subtitle"
            label="Subtitle / Description Tagline"
            v-model="form.subtitle"
            placeholder="e.g. Handcrafted stonewares for high-end collectors."
          />
        </div>

        <div class="form-row">
          <BaseInput
            id="imageUrl"
            label="Image URL Path"
            v-model="form.imageUrl"
            placeholder="e.g. https://images.unsplash.com/..."
            :error="formErrors.imageUrl"
            required
          />
          <!-- Live Preview Banner Image -->
          <div v-if="form.imageUrl && !formErrors.imageUrl" class="live-image-preview">
            <span class="preview-caption"><Image class="p-icon" /> Live Preview:</span>
            <img :src="form.imageUrl" class="live-preview-img" alt="Live Preview" />
          </div>
        </div>

        <div class="form-row">
          <BaseInput
            id="linkUrl"
            label="Action Redirect Target Link (optional)"
            v-model="form.linkUrl"
            placeholder="e.g. /products/stoneware-vase or /wishlist"
          />
        </div>

        <div class="form-row toggle-row">
          <label class="checkbox-label-wrap">
            <input
              type="checkbox"
              :checked="form.status === 'active'"
              @change="form.status = ($event.target as HTMLInputElement).checked ? 'active' : 'inactive'"
              class="checkbox-input"
            />
            <div class="checkbox-text">
              <span class="checkbox-title">Enable Banner on Homepage</span>
              <span class="checkbox-desc">Show this banner directly inside the homepage curation slider.</span>
            </div>
          </label>
        </div>
      </form>

      <template #footer>
        <div class="modal-footer-actions">
          <button class="close-modal-btn" type="button" @click="showModal = false">Cancel</button>
          <BaseButton variant="primary" type="button" @click="handleSaveBanner">
            {{ isEditing ? 'Update Banner' : 'Create Banner' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Global Confirmation Dialog Overlay -->
    <BaseConfirmDialog
      v-model="showConfirmDialog"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      :variant="confirmDialogVariant"
      :loading="confirmDialogLoading"
      @confirm="handleConfirmAction"
    />
  </div>
</template>

<style scoped>
.admin-banners-page {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 20px;
  flex-wrap: wrap;
}

.page-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
  text-align: left;
}

.page-subtitle {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--color-muted);
  margin: 0;
  text-align: left;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* Controls Toolbar */
.controls-toolbar {
  display: flex;
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

/* Banner Image Preview */
.banner-preview-wrap {
  width: 100px;
  height: 50px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-alt);
}

.banner-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Banner Info Cell */
.banner-info-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

.banner-title-txt {
  font-weight: 700;
  color: var(--color-primary);
}

.banner-subtitle-txt {
  font-size: 0.8rem;
  color: var(--color-muted);
}

/* Link Label */
.link-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-accent);
  font-weight: 600;
}

.link-icon {
  width: 14px;
  height: 14px;
}

.link-url-txt {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Status toggling */
.status-toggle-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.toggle-icon {
  width: 32px;
  height: 32px;
  transition: color var(--duration-fast);
}

.active-toggle {
  color: var(--color-success, #10b981);
}

.inactive-toggle {
  color: var(--color-muted);
}

/* Actions */
.actions-buttons {
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

.action-delete:hover {
  border-color: #ef4444;
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.05);
}

.action-icon {
  width: 14px;
  height: 14px;
}

/* live preview */
.live-image-preview {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.preview-caption {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  text-transform: uppercase;
}

.p-icon {
  width: 12px;
  height: 12px;
}

.live-preview-img {
  width: 100%;
  max-height: 140px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

/* Form Styles */
.banner-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: left;
}

.form-row {
  display: flex;
  flex-direction: column;
}

.toggle-row {
  margin-top: 10px;
}

.checkbox-label-wrap {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  margin-top: 3px;
  cursor: pointer;
  accent-color: var(--color-accent);
}

.checkbox-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.checkbox-title {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-primary);
}

.checkbox-desc {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--color-muted);
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}

.close-modal-btn {
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

.close-modal-btn:hover {
  background-color: var(--color-bg-alt);
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
</style>
