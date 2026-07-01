<script setup lang="ts">
/**
 * AdminSettingsPage
 * Configure and persist platform-wide financial variables and details.
 */
import { ref, onMounted } from 'vue';
import { adminApi, type PlatformSettings } from '../../../api/admin.api.js';
import { useToastStore } from '../../../stores/toast.store.js';
import { Settings, Save, RefreshCw, HelpCircle } from '@lucide/vue';

// UI Base Components
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseInput from '../../../components/ui/BaseInput.vue';

const toastStore = useToastStore();

const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);

// Form Fields (as strings to bind cleanly to BaseInput, then converted to numbers on save)
const form = ref({
  taxRate: '10',
  freeShippingThreshold: '100',
  shippingCost: '10',
  contactEmail: 'support@curio.com',
  lowStockThreshold: '5',
});

const formErrors = ref<Record<string, string>>({});

const fetchSettings = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await adminApi.fetchSettings();
    if (response.success && response.data) {
      form.value = {
        taxRate: String(response.data.taxRate),
        freeShippingThreshold: String(response.data.freeShippingThreshold),
        shippingCost: String(response.data.shippingCost),
        contactEmail: response.data.contactEmail,
        lowStockThreshold: String(response.data.lowStockThreshold),
      };
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to retrieve platform settings.';
  } finally {
    loading.value = false;
  }
};

const validateForm = (): boolean => {
  const errors: Record<string, string> = {};

  const tax = Number(form.value.taxRate);
  if (form.value.taxRate.trim() === '' || isNaN(tax) || tax < 0 || tax > 100) {
    errors.taxRate = 'Tax percentage must be a number between 0% and 100%.';
  }

  const threshold = Number(form.value.freeShippingThreshold);
  if (form.value.freeShippingThreshold.trim() === '' || isNaN(threshold) || threshold < 0) {
    errors.freeShippingThreshold = 'Free shipping threshold must be a non-negative number.';
  }

  const cost = Number(form.value.shippingCost);
  if (form.value.shippingCost.trim() === '' || isNaN(cost) || cost < 0) {
    errors.shippingCost = 'Shipping rate must be a non-negative number.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.value.contactEmail.trim()) {
    errors.contactEmail = 'Contact support email is required.';
  } else if (!emailRegex.test(form.value.contactEmail.trim())) {
    errors.contactEmail = 'Please provide a valid support email address.';
  }

  const lowStockVal = Number(form.value.lowStockThreshold);
  if (form.value.lowStockThreshold.trim() === '' || isNaN(lowStockVal) || !Number.isInteger(lowStockVal) || lowStockVal < 1) {
    errors.lowStockThreshold = 'Low stock threshold must be a positive integer greater than or equal to 1.';
  }

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const handleSaveSettings = async () => {
  if (!validateForm()) return;

  saving.value = true;
  try {
    const payload: PlatformSettings = {
      taxRate: Number(form.value.taxRate),
      freeShippingThreshold: Number(form.value.freeShippingThreshold),
      shippingCost: Number(form.value.shippingCost),
      contactEmail: form.value.contactEmail.trim(),
      lowStockThreshold: Number(form.value.lowStockThreshold),
    };

    const response = await adminApi.updateSettings(payload);
    if (response.success && response.data) {
      toastStore.success('Platform configuration saved successfully.');
      form.value = {
        taxRate: String(response.data.taxRate),
        freeShippingThreshold: String(response.data.freeShippingThreshold),
        shippingCost: String(response.data.shippingCost),
        contactEmail: response.data.contactEmail,
        lowStockThreshold: String(response.data.lowStockThreshold),
      };
    }
  } catch (err: any) {
    toastStore.error(err?.response?.data?.message || 'Failed to update platform settings.');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchSettings();
});
</script>

<template>
  <div class="admin-settings-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">Platform Settings</h1>
        <p class="page-subtitle">Configure tax policies, free shipping pricing tiers, and administration support emails.</p>
      </div>
      <BaseButton variant="secondary" @click="fetchSettings" :disabled="loading || saving">
        <RefreshCw :class="['btn-icon', { 'spin-animation': loading }]" /> Sync
      </BaseButton>
    </header>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <h3>Failed to load settings</h3>
      <p>{{ error }}</p>
      <BaseButton variant="primary" @click="fetchSettings">Retry</BaseButton>
    </div>

    <!-- Settings Card -->
    <div v-else-if="!loading" class="settings-card motion-scale-in">
      <div class="card-header">
        <Settings class="header-icon" />
        <h2 class="card-title">General Platform variables</h2>
      </div>

      <form @submit.prevent="handleSaveSettings" class="settings-form">
        <!-- Grid Configuration -->
        <div class="settings-grid">
          <!-- Tax Rate -->
          <div class="form-group-item">
            <div class="input-info-header">
              <span class="input-title-badge">Financials</span>
            </div>
            <BaseInput
              id="taxRate"
              label="Standard Tax Percentage (%)"
              v-model="form.taxRate"
              placeholder="e.g. 10"
              :error="formErrors.taxRate"
              required
              :disabled="saving"
            />
            <span class="field-explanation">
              <HelpCircle class="info-inline-icon" />
              Applied to the cart subtotal value after discount code adjustments.
            </span>
          </div>

          <!-- Free Shipping Threshold -->
          <div class="form-group-item">
            <div class="input-info-header">
              <span class="input-title-badge">Logistics</span>
            </div>
            <BaseInput
              id="freeShippingThreshold"
              label="Free Shipping Minimum Threshold ($)"
              v-model="form.freeShippingThreshold"
              placeholder="e.g. 100"
              :error="formErrors.freeShippingThreshold"
              required
              :disabled="saving"
            />
            <span class="field-explanation">
              <HelpCircle class="info-inline-icon" />
              Subtotal threshold above which flat shipping fees are waived.
            </span>
          </div>

          <!-- Shipping Cost -->
          <div class="form-group-item">
            <div class="input-info-header">
              <span class="input-title-badge">Logistics</span>
            </div>
            <BaseInput
              id="shippingCost"
              label="Flat Shipping Cost Rate ($)"
              v-model="form.shippingCost"
              placeholder="e.g. 10"
              :error="formErrors.shippingCost"
              required
              :disabled="saving"
            />
            <span class="field-explanation">
              <HelpCircle class="info-inline-icon" />
              Standard rate applied to orders failing to meet the free shipping threshold.
            </span>
          </div>

          <!-- Support Contact Email -->
          <div class="form-group-item">
            <div class="input-info-header">
              <span class="input-title-badge">Communication</span>
            </div>
            <BaseInput
              id="contactEmail"
              label="Contact Support Email"
              type="email"
              v-model="form.contactEmail"
              placeholder="e.g. support@curio.com"
              :error="formErrors.contactEmail"
              required
              :disabled="saving"
            />
            <span class="field-explanation">
              <HelpCircle class="info-inline-icon" />
              Address featured on customer invoice emails and order summary sheets.
            </span>
          </div>

          <!-- Low Stock Threshold -->
          <div class="form-group-item">
            <div class="input-info-header">
              <span class="input-title-badge">Inventory</span>
            </div>
            <BaseInput
              id="lowStockThreshold"
              label="Low Stock Threshold warning (units)"
              v-model="form.lowStockThreshold"
              placeholder="e.g. 5"
              :error="formErrors.lowStockThreshold"
              required
              :disabled="saving"
            />
            <span class="field-explanation">
              <HelpCircle class="info-inline-icon" />
              Platform stock quantity warning threshold. Sellers will see low stock alerts at or below this value.
            </span>
          </div>
        </div>

        <!-- Form Footer Actions -->
        <div class="form-footer-actions">
          <BaseButton variant="primary" type="submit" :loading="saving" class="save-settings-btn">
            <Save class="btn-icon" /> Save Settings
          </BaseButton>
        </div>
      </form>
    </div>

    <!-- Loading State -->
    <div v-else class="loading-container">
      <RefreshCw class="spin-animation large-spinner" />
      <p>Retrieving platform configurations...</p>
    </div>
  </div>
</template>

<style scoped>
.admin-settings-page {
  padding: 32px;
  max-width: 1000px;
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

.spin-animation {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Settings Card */
.settings-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 32px;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 16px;
}

.header-icon {
  width: 24px;
  height: 24px;
  color: var(--color-accent);
}

.card-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 750;
  color: var(--color-primary);
  margin: 0;
}

/* Form Styles */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.form-group-item {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.input-info-header {
  margin-bottom: 8px;
}

.input-title-badge {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  font-weight: 750;
  text-transform: uppercase;
  color: var(--color-accent);
  background-color: var(--color-bg-alt);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

.field-explanation {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--color-muted);
  margin-top: 8px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.4;
}

.info-inline-icon {
  width: 14px;
  height: 14px;
  color: var(--color-border);
  flex-shrink: 0;
  margin-top: 1px;
}

/* Save btn footer */
.form-footer-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
  padding-top: 24px;
}

.save-settings-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px !important;
}

/* Loading state */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 24px;
  color: var(--color-muted);
  gap: 16px;
}

.large-spinner {
  width: 48px;
  height: 48px;
  color: var(--color-accent);
}

/* Error Banner */
.error-banner {
  text-align: center;
  padding: 80px 24px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  max-width: 500px;
  margin: 0 auto;
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
</style>
