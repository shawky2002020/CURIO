<script setup lang="ts">
/**
 * AdminCouponsPage
 * Administrative Coupon (Promo Code) management console.
 * Composes BaseTable, BaseModal, BasePagination, and BaseConfirmDialog.
 */
import { ref, onMounted, watch } from 'vue';
import { adminApi, type CouponRegistryItem } from '../../../api/admin.api.js';
import { useToastStore } from '../../../stores/toast.store.js';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Tag,
  ToggleLeft,
  ToggleRight,
} from '@lucide/vue';

// UI Base Components
import BaseTable from '../../../components/ui/BaseTable.vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BasePagination from '../../../components/ui/BasePagination.vue';
import BaseConfirmDialog from '../../../components/ui/BaseConfirmDialog.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseInput from '../../../components/ui/BaseInput.vue';
import BaseSelect from '../../../components/ui/BaseSelect.vue';

const toastStore = useToastStore();

const loading = ref(true);
const error = ref<string | null>(null);

const coupons = ref<CouponRegistryItem[]>([]);
const totalCoupons = ref(0);
const totalPages = ref(1);
const currentPage = ref(1);
const limitPerPage = ref(10);

const search = ref('');

// Table Headers
const tableHeaders = [
  { key: 'code', label: 'Promo Code' },
  { key: 'discount', label: 'Discount Value' },
  { key: 'usage', label: 'Usage (Used / Limit)' },
  { key: 'expirationDate', label: 'Expiration' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '150px' },
];

// Coupon Modal state
const showModal = ref(false);
const isEditing = ref(false);
const activeCouponId = ref<string | null>(null);

// Form Fields
const form = ref({
  code: '',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: '',
  isActive: true,
  usageLimit: '',
  expirationDate: '',
});

const formErrors = ref<Record<string, string>>({});

// Confirmation Dialog state
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');
const confirmDialogVariant = ref<'primary' | 'danger' | 'warning'>('primary');
const confirmDialogLoading = ref(false);
const onConfirmCallback = ref<(() => Promise<void>) | null>(null);

const fetchCoupons = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await adminApi.fetchCoupons({
      page: currentPage.value,
      limit: limitPerPage.value,
      search: search.value.trim() || undefined,
    });
    if (response.success && response.data) {
      coupons.value = response.data.coupons;
      totalCoupons.value = response.data.total;
      totalPages.value = response.data.pages;
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to retrieve promo codes.';
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
    fetchCoupons();
  }, 350);
});

onMounted(() => {
  fetchCoupons();
});

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchCoupons();
};

const openCreateModal = () => {
  isEditing.value = false;
  activeCouponId.value = null;
  formErrors.value = {};
  form.value = {
    code: '',
    discountType: 'percentage',
    discountValue: '',
    isActive: true,
    usageLimit: '',
    expirationDate: '',
  };
  showModal.value = true;
};

const openEditModal = (coupon: CouponRegistryItem) => {
  isEditing.value = true;
  activeCouponId.value = coupon._id;
  formErrors.value = {};
  form.value = {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    isActive: coupon.isActive,
    usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
    expirationDate: coupon.expirationDate ? coupon.expirationDate.split('T')[0] : '',
  };
  showModal.value = true;
};

const validateForm = (): boolean => {
  const errors: Record<string, string> = {};
  if (!form.value.code.trim()) {
    errors.code = 'Promo code is required.';
  } else if (!/^[A-Z0-9_-]+$/i.test(form.value.code.trim())) {
    errors.code = 'Code must contain only letters, numbers, hyphens, and underscores.';
  }

  const dValue = Number(form.value.discountValue);
  if (form.value.discountValue === '' || isNaN(dValue) || dValue <= 0) {
    errors.discountValue = 'Discount value must be greater than zero.';
  } else if (form.value.discountType === 'percentage' && dValue > 100) {
    errors.discountValue = 'Percentage discount cannot exceed 100%.';
  }

  if (form.value.usageLimit) {
    const limit = Number(form.value.usageLimit);
    if (isNaN(limit) || limit <= 0) {
      errors.usageLimit = 'Usage limit must be a positive integer.';
    }
  }

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const handleSaveCoupon = async () => {
  if (!validateForm()) return;

  try {
    const payload = {
      code: form.value.code.toUpperCase().trim(),
      discountType: form.value.discountType,
      discountValue: Number(form.value.discountValue),
      isActive: form.value.isActive,
      usageLimit: form.value.usageLimit ? Number(form.value.usageLimit) : undefined,
      expirationDate: form.value.expirationDate ? form.value.expirationDate : undefined,
    };

    let response;
    if (isEditing.value && activeCouponId.value) {
      // In edit, send null explicitly to clear values if they are empty
      const editPayload = {
        ...payload,
        usageLimit: form.value.usageLimit ? Number(form.value.usageLimit) : null,
        expirationDate: form.value.expirationDate ? form.value.expirationDate : null,
      } as any;
      response = await adminApi.updateCoupon(activeCouponId.value, editPayload);
    } else {
      response = await adminApi.createCoupon(payload);
    }

    if (response.success) {
      toastStore.success(`Promo code ${isEditing.value ? 'updated' : 'created'} successfully.`);
      showModal.value = false;
      fetchCoupons();
    }
  } catch (err: any) {
    if (err.response?.status === 400 && err.response?.data?.message) {
      formErrors.value = { code: err.response.data.message };
    } else {
      toastStore.error('An error occurred while saving the coupon.');
    }
  }
};

const handleToggleActive = async (coupon: CouponRegistryItem) => {
  const newStatus = !coupon.isActive;
  try {
    const response = await adminApi.updateCoupon(coupon._id, { isActive: newStatus });
    if (response.success) {
      toastStore.success(`Promo code ${coupon.code} has been ${newStatus ? 'activated' : 'deactivated'}.`);
      fetchCoupons();
    }
  } catch (err: any) {
    toastStore.error(err?.response?.data?.message || 'Failed to update promo status.');
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
      // Errors handled inside callback
    } finally {
      confirmDialogLoading.value = false;
      onConfirmCallback.value = null;
    }
  }
};

const handleDeleteCoupon = (coupon: CouponRegistryItem) => {
  triggerConfirm(
    'Delete Promo Code',
    `Are you sure you want to permanently delete the promo code "${coupon.code}"? This action cannot be undone.`,
    'danger',
    async () => {
      try {
        const response = await adminApi.deleteCoupon(coupon._id);
        if (response.success) {
          toastStore.success('Promo code deleted successfully.');
          fetchCoupons();
        }
      } catch (err: any) {
        toastStore.error(err?.response?.data?.message || 'Failed to delete promo code.');
        throw err;
      }
    }
  );
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const isExpired = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
};
</script>

<template>
  <div class="admin-coupons-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">Coupon Management</h1>
        <p class="page-subtitle">Configure collectors discounts, manage atelier registries, and set usage limits.</p>
      </div>
      <BaseButton variant="primary" @click="openCreateModal">
        <Plus class="btn-icon" /> Create Coupon
      </BaseButton>
    </header>

    <!-- Toolbar Filters -->
    <section class="controls-toolbar">
      <div class="search-input-wrap">
        <Search class="search-icon" />
        <input
          v-model="search"
          type="text"
          placeholder="Search coupons by code keyword..."
          class="search-input-box"
        />
      </div>
    </section>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <AlertTriangle class="error-icon" />
      <h3>Failed to load coupons</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchCoupons">Retry</button>
    </div>

    <!-- Coupons Table -->
    <template v-else>
      <BaseTable
        :headers="tableHeaders"
        :items="coupons"
        :loading="loading"
        emptyText="No Promo Codes Found"
      >
        <!-- Cell: Code -->
        <template #cell(code)="{ item }">
          <div class="code-cell-wrapper">
            <Tag class="code-icon" />
            <span class="code-label">{{ item.code }}</span>
          </div>
        </template>

        <!-- Cell: Discount -->
        <template #cell(discount)="{ item }">
          <span class="discount-label">
            {{ item.discountType === 'percentage' ? `${item.discountValue}%` : `$${item.discountValue.toFixed(2)}` }}
            <span class="discount-type-sub">({{ item.discountType }})</span>
          </span>
        </template>

        <!-- Cell: Usage -->
        <template #cell(usage)="{ item }">
          <span class="usage-count">
            <strong>{{ item.usedCount }}</strong>
            <span class="muted-divider">/</span>
            <span>{{ item.usageLimit !== undefined ? item.usageLimit : '∞' }}</span>
          </span>
        </template>

        <!-- Cell: Expiration -->
        <template #cell(expirationDate)="{ item }">
          <span :class="['date-label', { 'expired-text': isExpired(item.expirationDate) }]">
            {{ formatDate(item.expirationDate) }}
            <span v-if="isExpired(item.expirationDate)" class="expired-badge">Expired</span>
          </span>
        </template>

        <!-- Cell: Status -->
        <template #cell(status)="{ item }">
          <button
            class="status-toggle-btn"
            :title="item.isActive ? 'Deactivate Coupon' : 'Activate Coupon'"
            @click="handleToggleActive(item)"
          >
            <ToggleRight v-if="item.isActive" class="toggle-icon active-toggle" />
            <ToggleLeft v-else class="toggle-icon inactive-toggle" />
          </button>
        </template>

        <!-- Cell: Actions -->
        <template #cell(actions)="{ item }">
          <div class="actions-buttons">
            <button class="action-btn" title="Edit Coupon" @click="openEditModal(item)">
              <Edit class="action-icon" />
            </button>
            <button class="action-btn action-delete" title="Delete Coupon" @click="handleDeleteCoupon(item)">
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

    <!-- MODAL: Coupon Creator / Editor -->
    <BaseModal
      :show="showModal"
      :title="isEditing ? 'Edit Atelier Coupon' : 'Create Atelier Coupon'"
      @close="showModal = false"
    >
      <form @submit.prevent="handleSaveCoupon" class="coupon-form">
        <div class="form-row">
          <BaseInput
            id="code"
            label="Promo Code (uppercase letters, numbers, dashes)"
            v-model="form.code"
            placeholder="e.g. SUMMER25"
            :error="formErrors.code"
            required
            :disabled="isEditing"
          />
        </div>

        <div class="form-row form-grid-2">
          <div>
            <BaseSelect
              id="discountType"
              label="Discount Type"
              v-model="form.discountType"
              :options="[
                { label: 'Percentage (%)', value: 'percentage' },
                { label: 'Fixed Amount ($)', value: 'fixed' },
              ]"
            />
          </div>
          <div>
            <BaseInput
              id="discountValue"
              label="Value"
              v-model="form.discountValue"
              placeholder="e.g. 15"
              :error="formErrors.discountValue"
              required
            />
          </div>
        </div>

        <div class="form-row form-grid-2">
          <div>
            <BaseInput
              id="usageLimit"
              label="Usage Limit (leave empty for unlimited)"
              v-model="form.usageLimit"
              placeholder="e.g. 50"
              :error="formErrors.usageLimit"
            />
          </div>
          <div>
            <BaseInput
              id="expirationDate"
              label="Expiration Date"
              type="date"
              v-model="form.expirationDate"
            />
          </div>
        </div>

        <div class="form-row toggle-row">
          <label class="checkbox-label-wrap">
            <input type="checkbox" v-model="form.isActive" class="checkbox-input" />
            <div class="checkbox-text">
              <span class="checkbox-title">Activate immediately</span>
              <span class="checkbox-desc">Check this to make this coupon usable by collectors immediately.</span>
            </div>
          </label>
        </div>
      </form>

      <template #footer>
        <div class="modal-footer-actions">
          <button class="close-modal-btn" type="button" @click="showModal = false">Cancel</button>
          <BaseButton variant="primary" type="button" @click="handleSaveCoupon">
            {{ isEditing ? 'Update Coupon' : 'Create Coupon' }}
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
.admin-coupons-page {
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

/* Code Cell */
.code-cell-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-icon {
  width: 16px;
  height: 16px;
  color: var(--color-accent);
}

.code-label {
  font-family: var(--font-mono, monospace);
  font-weight: 750;
  font-size: 0.95rem;
  color: var(--color-primary);
}

/* Discount cell */
.discount-label {
  font-family: var(--font-mono, monospace);
  font-weight: 700;
  color: var(--color-text);
}

.discount-type-sub {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--color-muted);
  font-weight: 600;
  text-transform: capitalize;
  margin-left: 2px;
}

.usage-count {
  font-family: var(--font-mono, monospace);
}

.muted-divider {
  color: var(--color-border);
  margin: 0 4px;
}

/* Expiration */
.date-label {
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.expired-text {
  color: #ef4444;
  font-weight: 600;
}

.expired-badge {
  font-family: var(--font-sans);
  font-size: 0.65rem;
  font-weight: 700;
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
}

/* Toggle btn */
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

/* Actions list */
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

/* Form Styles */
.coupon-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: left;
}

.form-row {
  display: flex;
  flex-direction: column;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
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
</style>
