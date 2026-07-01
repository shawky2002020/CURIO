<script setup lang="ts">

import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '../../../stores/auth.store.js';
import { adminApi } from '../../../api/admin.api.js';
import type { UserRegistryItem } from '../../../api/admin.api.js';
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from '@lucide/vue';

// UI Base Components
import BaseSelect from '../../../components/ui/BaseSelect.vue';
import BaseTable from '../../../components/ui/BaseTable.vue';
import BasePagination from '../../../components/ui/BasePagination.vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BaseConfirmDialog from '../../../components/ui/BaseConfirmDialog.vue';

const authStore = useAuthStore();

const loading = ref(true);
const error = ref<string | null>(null);

const users = ref<UserRegistryItem[]>([]);
const totalUsers = ref(0);
const totalPages = ref(1);
const currentPage = ref(1);
const limitPerPage = ref(10);

// Demographics stats
const stats = ref({
  totalCustomers: 0,
  activeCustomers: 0,
  totalSellers: 0,
  activeSellers: 0,
});

// Filters & Search
const search = ref('');
const roleFilter = ref('');
const statusFilter = ref('');

const roleFilterOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Admin', value: 'admin' },
  { label: 'Seller', value: 'seller' },
  { label: 'Customer', value: 'customer' },
];

const statusFilterOptions = [
  { label: 'All Statuses (Excl. Deleted)', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Deleted', value: 'deleted' },
];

const roleEditOptions = [
  { label: 'Customer', value: 'customer' },
  { label: 'Seller', value: 'seller' },
  { label: 'Admin', value: 'admin' },
];

const statusEditOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Deleted (Soft Delete)', value: 'deleted' },
];

// Table configuration
const tableHeaders = [
  { key: 'fullName', label: 'Profile' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
];

// Modals
const showViewModal = ref(false);
const showEditModal = ref(false);
const activeUser = ref<UserRegistryItem | null>(null);

// Custom Confirmation Dialog state
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');
const confirmDialogVariant = ref<'primary' | 'danger' | 'warning'>('primary');
const confirmDialogLoading = ref(false);
const onConfirmCallback = ref<(() => Promise<void>) | null>(null);

// Edit Form Fields
const editForm = ref({
  fullName: '',
  email: '',
  phone: '',
  role: 'customer' as 'customer' | 'seller' | 'admin',
  status: 'active' as 'active' | 'blocked' | 'deleted',
});

const editSaving = ref(false);

// Toast / Notification feedback
const feedbackMessage = ref<string | null>(null);
const feedbackType = ref<'success' | 'error'>('success');

const triggerFeedback = (message: string, type: 'success' | 'error' = 'success') => {
  feedbackMessage.value = message;
  feedbackType.value = type;
  setTimeout(() => {
    feedbackMessage.value = null;
  }, 4000);
};

const fetchUsers = async (): Promise<void> => {
  loading.value = true;
  error.value = null;
  try {
    const response = await adminApi.fetchUsers({
      page: currentPage.value,
      limit: limitPerPage.value,
      search: search.value.trim() || undefined,
      role: roleFilter.value || undefined,
      status: statusFilter.value || undefined,
    });
    if (response.success && response.data) {
      users.value = response.data.users;
      totalUsers.value = response.data.total;
      totalPages.value = response.data.pages;
      if (response.data.stats) {
        stats.value = response.data.stats;
      }
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to load user list.';
  } finally {
    loading.value = false;
  }
};

// Refetch on pagination and filters
watch([roleFilter, statusFilter], () => {
  currentPage.value = 1;
  fetchUsers();
});

let searchTimeout: any = null;
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchUsers();
  }, 350);
});

onMounted(() => {
  fetchUsers();
});

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchUsers();
};

// Avatar fallback initials generator
const getInitials = (name: string): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const statusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: '#10b981',
    blocked: '#f59e0b',
    deleted: '#ef4444',
  };
  return colors[status] || '#a3aab8';
};

const roleBadgeColor = (role: string): string => {
  const colors: Record<string, string> = {
    admin: '#8b5cf6',
    seller: '#3b82f6',
    customer: '#6b7280',
  };
  return colors[role] || '#a3aab8';
};

// Modal Actions
const openViewModal = (user: UserRegistryItem) => {
  activeUser.value = user;
  showViewModal.value = true;
};

const openEditModal = (user: UserRegistryItem) => {
  activeUser.value = user;
  editForm.value = {
    fullName: user.fullName,
    email: user.email || '',
    phone: user.phone || '',
    role: user.role,
    status: user.status,
  };
  showEditModal.value = true;
};

const closeModals = () => {
  showViewModal.value = false;
  showEditModal.value = false;
  activeUser.value = null;
};

// Orchestrate Confirmation Overlays
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

// Quick Moderation Action
const handleQuickStatusChange = (user: UserRegistryItem, newStatus: 'active' | 'blocked' | 'deleted') => {
  // Lockout self-check
  if (authStore.user?.id === user._id) {
    triggerFeedback('Self-modification of status is prohibited.', 'error');
    return;
  }

  const title = newStatus === 'deleted' ? 'Delete User Account' : 'Change User Status';
  const confirmMsg = newStatus === 'deleted' 
    ? `Are you sure you want to soft delete ${user.fullName}? This will restrict their account access.`
    : `Are you sure you want to change the status of ${user.fullName} to "${newStatus}"?`;
  const variant = newStatus === 'deleted' ? 'danger' : newStatus === 'blocked' ? 'warning' : 'primary';

  openConfirm(title, confirmMsg, variant, async () => {
    try {
      const response = await adminApi.updateUser(user._id, { status: newStatus });
      if (response.success) {
        triggerFeedback(`Successfully updated ${user.fullName}'s status to ${newStatus}.`, 'success');
        fetchUsers();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update user status.';
      triggerFeedback(msg, 'error');
      throw err;
    }
  });
};

const submitEditForm = async () => {
  if (!activeUser.value) return;
  editSaving.value = true;

  const payload: any = {
    fullName: editForm.value.fullName,
    email: editForm.value.email || undefined,
    phone: editForm.value.phone || undefined,
  };

  // Self-lockout check: admins cannot modify their own role/status fields
  const isSelf = authStore.user?.id === activeUser.value._id;
  if (!isSelf) {
    payload.role = editForm.value.role;
    payload.status = editForm.value.status;
  }

  try {
    const response = await adminApi.updateUser(activeUser.value._id, payload);
    if (response.success) {
      triggerFeedback(`Successfully updated details for ${editForm.value.fullName}.`, 'success');
      closeModals();
      fetchUsers();
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || 'Failed to save account details.';
    triggerFeedback(msg, 'error');
  } finally {
    editSaving.value = false;
  }
};

const clearFilters = () => {
  search.value = '';
  roleFilter.value = '';
  statusFilter.value = '';
};
</script>

<template>
  <div class="admin-users-page">
    <!-- Page Header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">User Management</h1>
        <p class="page-subtitle">Moderate roles, restrict logins, and audit registered accounts.</p>
      </div>
    </header>

    <!-- Demographics/Insights Statistics Banner -->
    <section class="insights-stats-row" v-if="stats.totalCustomers > 0 || stats.totalSellers > 0">
      <div class="stat-card stat-card--collectors">
        <span class="stat-card-label">Total Collectors</span>
        <strong class="stat-card-value">{{ stats.totalCustomers }}</strong>
      </div>
      <div class="stat-card stat-card--active-collectors">
        <span class="stat-card-label">Active Collectors</span>
        <strong class="stat-card-value">{{ stats.activeCustomers }}</strong>
      </div>
      <div class="stat-card stat-card--studios">
        <span class="stat-card-label">Total Studios</span>
        <strong class="stat-card-value">{{ stats.totalSellers }}</strong>
      </div>
      <div class="stat-card stat-card--active-studios">
        <span class="stat-card-label">Active Studios</span>
        <strong class="stat-card-value">{{ stats.activeSellers }}</strong>
      </div>
    </section>

    <!-- Notification Toasts -->
    <Transition name="fade">
      <div v-if="feedbackMessage" class="feedback-toast" :class="feedbackType">
        <ShieldAlert v-if="feedbackType === 'error'" class="toast-icon" />
        <ShieldCheck v-else class="toast-icon" />
        <span>{{ feedbackMessage }}</span>
      </div>
    </Transition>

    <!-- Filters and Searches -->
    <section class="controls-panel">
      <div class="search-input-wrap">
        <Search class="search-icon" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or email..."
          class="search-box-input"
        />
      </div>

      <div class="filter-dropdowns">
        <BaseSelect
          v-model="roleFilter"
          :options="roleFilterOptions"
          placeholder="All Roles"
          class="filter-select-custom"
        />

        <BaseSelect
          v-model="statusFilter"
          :options="statusFilterOptions"
          placeholder="All Statuses"
          class="filter-select-custom"
        />
      </div>
    </section>

    <!-- Error Boundary -->
    <div v-if="error" class="error-boundary">
      <AlertTriangle class="error-icon" />
      <h3>Failed to load user list</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchUsers">
        Retry
      </button>
    </div>

    <!-- Generic Data Table composition -->
    <template v-else>
      <BaseTable
        :headers="tableHeaders"
        :items="users"
        :loading="loading"
        emptyText="No Users Found"
      >
        <!-- Cell: Profile (Initials + Name) -->
        <template #cell(fullName)="{ item }">
          <div class="profile-cell-wrap">
            <div class="avatar-circle">
              <span class="avatar-initials">{{ getInitials(item.fullName) }}</span>
            </div>
            <span class="user-name-text">{{ item.fullName }}</span>
          </div>
        </template>

        <!-- Cell: Email -->
        <template #cell(email)="{ item }">
          {{ item.email || '—' }}
        </template>

        <!-- Cell: Phone -->
        <template #cell(phone)="{ item }">
          {{ item.phone || '—' }}
        </template>

        <!-- Cell: Role Badge -->
        <template #cell(role)="{ item }">
          <span
            class="role-badge"
            :style="{ backgroundColor: roleBadgeColor(item.role) + '15', color: roleBadgeColor(item.role) }"
          >
            {{ item.role }}
          </span>
        </template>

        <!-- Cell: Status Badge -->
        <template #cell(status)="{ item }">
          <span
            class="status-badge"
            :style="{ backgroundColor: statusBadgeColor(item.status) + '15', color: statusBadgeColor(item.status) }"
          >
            {{ item.status }}
          </span>
        </template>

        <!-- Cell: Created At -->
        <template #cell(createdAt)="{ item }">
          <span class="date-cell">{{ formatDate(item.createdAt) }}</span>
        </template>

        <!-- Cell: Actions -->
        <template #cell(actions)="{ item }">
          <div class="actions-buttons-wrap">
            <button class="action-btn" title="View details" @click="openViewModal(item)">
              <Eye class="action-icon" />
            </button>
            <button class="action-btn" title="Edit account" @click="openEditModal(item)">
              <Edit2 class="action-icon" />
            </button>
            <!-- Quick Activate / Restrict -->
            <button
              v-if="item.status === 'blocked'"
              class="action-btn action-activate"
              title="Activate account"
              :disabled="authStore.user?.id === item._id"
              @click="handleQuickStatusChange(item, 'active')"
            >
              <ShieldCheck class="action-icon" />
            </button>
            <button
              v-else-if="item.status === 'active'"
              class="action-btn action-restrict"
              title="Restrict/Block account"
              :disabled="authStore.user?.id === item._id"
              @click="handleQuickStatusChange(item, 'blocked')"
            >
              <ShieldAlert class="action-icon" />
            </button>
            <!-- Soft Delete -->
            <button
              v-if="item.status !== 'deleted'"
              class="action-btn action-delete"
              title="Soft delete"
              :disabled="authStore.user?.id === item._id"
              @click="handleQuickStatusChange(item, 'deleted')"
            >
              <Trash2 class="action-icon" />
            </button>
          </div>
        </template>

        <!-- Dynamic Empty State Override -->
        <template #empty>
          <div class="empty-state-container">
            <Search class="empty-state-icon" />
            <h4>No Users Found</h4>
            <p>We couldn't find any accounts matching your search terms or filters.</p>
            <button class="clear-filters-btn" type="button" @click="clearFilters">Clear Filters</button>
          </div>
        </template>
      </BaseTable>

      <!-- Reusable Pagination controls -->
      <BasePagination
        :currentPage="currentPage"
        :totalPages="totalPages"
        @change="handlePageChange"
      />
    </template>

    <!-- MODAL: View Details -->
    <BaseModal :show="showViewModal" title="User Profile Detail" @close="closeModals">
      <div v-if="activeUser" class="read-only-grid">
        <div class="view-group">
          <span class="view-label">User ID</span>
          <span class="view-value mono">{{ activeUser._id }}</span>
        </div>
        <div class="view-group">
          <span class="view-label">Full Name</span>
          <span class="view-value">{{ activeUser.fullName }}</span>
        </div>
        <div class="view-group">
          <span class="view-label">Email Address</span>
          <span class="view-value">{{ activeUser.email || '—' }}</span>
        </div>
        <div class="view-group">
          <span class="view-label">Phone Number</span>
          <span class="view-value">{{ activeUser.phone || '—' }}</span>
        </div>
        <div class="view-group">
          <span class="view-label">Role Classification</span>
          <span class="view-value">
            <span class="role-badge" :style="{ backgroundColor: roleBadgeColor(activeUser.role) + '15', color: roleBadgeColor(activeUser.role) }">
              {{ activeUser.role }}
            </span>
          </span>
        </div>
        <div class="view-group">
          <span class="view-label">Status Summary</span>
          <span class="view-value">
            <span class="status-badge" :style="{ backgroundColor: statusBadgeColor(activeUser.status) + '15', color: statusBadgeColor(activeUser.status) }">
              {{ activeUser.status }}
            </span>
          </span>
        </div>
        <div class="view-group">
          <span class="view-label">Created At</span>
          <span class="view-value">{{ formatDate(activeUser.createdAt) }}</span>
        </div>
      </div>
      <template #footer>
        <button class="secondary-btn" @click="closeModals">Close Summary</button>
      </template>
    </BaseModal>

    <!-- MODAL: Edit Profile -->
    <BaseModal :show="showEditModal" title="Edit User Account" @close="closeModals">
      <form @submit.prevent="submitEditForm" id="edit-user-form">
        <div class="form-inputs-wrap">
          <!-- Full Name -->
          <div class="input-group">
            <label for="edit-name">Full Name</label>
            <input
              id="edit-name"
              v-model="editForm.fullName"
              type="text"
              required
              class="form-input"
            />
          </div>
          <!-- Email -->
          <div class="input-group">
            <label for="edit-email">Email Address</label>
            <input
              id="edit-email"
              v-model="editForm.email"
              type="email"
              class="form-input"
            />
          </div>
          <!-- Phone -->
          <div class="input-group">
            <label for="edit-phone">Phone Number</label>
            <input
              id="edit-phone"
              v-model="editForm.phone"
              type="text"
              class="form-input"
            />
          </div>

          <!-- Lockout Warnings -->
          <div v-if="activeUser && authStore.user?.id === activeUser._id" class="safety-warning-banner">
            <AlertTriangle class="warn-icon" />
            <span>You cannot modify your own administrative role or active status.</span>
          </div>

          <!-- Role Selection -->
          <div class="input-group">
            <BaseSelect
              v-model="editForm.role"
              :options="roleEditOptions"
              label="Role Classification"
              :disabled="!!activeUser && authStore.user?.id === activeUser._id"
            />
          </div>
          <!-- Status Selection -->
          <div class="input-group">
            <BaseSelect
              v-model="editForm.status"
              :options="statusEditOptions"
              label="Status Summary"
              :disabled="!!activeUser && authStore.user?.id === activeUser._id"
            />
          </div>
        </div>
      </form>
      <template #footer>
        <button type="button" class="secondary-btn" @click="closeModals">Cancel</button>
        <button type="submit" form="edit-user-form" class="primary-btn" :disabled="editSaving">
          <span v-if="editSaving">Saving...</span>
          <span v-else>Save Changes</span>
        </button>
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
.admin-users-page {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 32px;
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

/* Controls Panel (Search/Filters) */
.controls-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
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

.search-box-input {
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

.search-box-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.filter-dropdowns {
  display: flex;
  gap: 12px;
}

.filter-select-custom {
  width: 220px;
  flex-shrink: 0;
}

/* Profile Cell */
.profile-cell-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background-color: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-initials {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-accent);
}

.user-name-text {
  font-weight: 700;
  color: var(--color-text);
}

/* Badges */
.role-badge,
.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-transform: capitalize;
  display: inline-block;
}

.date-cell {
  color: var(--color-muted);
}

.empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 360px;
  margin: 0 auto;
}

.empty-state-icon {
  width: 48px;
  height: 48px;
  color: var(--color-muted);
  opacity: 0.5;
  margin-bottom: 8px;
}

.empty-state-container h4 {
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
  white-space: normal;
}

.clear-filters-btn {
  margin-top: 8px;
  padding: 8px 16px;
  background-color: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-filters-btn:hover {
  background-color: var(--color-border);
}

.actions-buttons-wrap {
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

.action-activate:hover {
  border-color: #10b981;
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.05);
}

.action-restrict:hover {
  border-color: #f59e0b;
  color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.05);
}

.action-delete:hover {
  border-color: #ef4444;
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.05);
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.action-icon {
  width: 14px;
  height: 14px;
}

/* Error Boundary */
.error-boundary {
  text-align: center;
  padding: 80px 24px;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.error-boundary h3 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.error-boundary p {
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

/* Detail view layout */
.read-only-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.view-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.view-label {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.view-value {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}

.view-value.mono {
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
}

/* Edit form layouts */
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

.input-group label {
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

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--color-bg-alt);
}

/* Safety lock banner */
.safety-warning-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background-color: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  color: #d97706;
}

.warn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.primary-btn,
.secondary-btn {
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.primary-btn {
  background-color: var(--color-primary);
  color: white;
  border: none;
}

.primary-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-btn {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.secondary-btn:hover {
  background-color: var(--color-bg-alt);
}

/* Feedback toasts */
.feedback-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 700;
  z-index: 1200;
}

.feedback-toast.success {
  background-color: #10b981;
  color: white;
}

.feedback-toast.error {
  background-color: #ef4444;
  color: white;
}

.toast-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive grid scales */
@media (max-width: 1280px) {
  .controls-panel {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .search-input-wrap {
    max-width: none;
  }
  .filter-dropdowns {
    flex-wrap: wrap;
  }
  .filter-select-custom {
    flex: 1;
    min-width: 180px;
  }
}

/* Statistics Insights cards banner */
.insights-stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

.stat-card--collectors {
  border-left: 4px solid #6366f1;
}
.stat-card--active-collectors {
  border-left: 4px solid #10b981;
}
.stat-card--studios {
  border-left: 4px solid #3b82f6;
}
.stat-card--active-studios {
  border-left: 4px solid #059669;
}
</style>
