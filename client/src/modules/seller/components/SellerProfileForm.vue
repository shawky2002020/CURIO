<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '../../../stores/user.store.js';
import BaseInput from '../../../components/ui/BaseInput.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';
import SellerLogoUploader from './SellerLogoUploader.vue';

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

const userStore = useUserStore();

const storeName = ref('');
const storeDescription = ref('');
const storePhone = ref('');
const storeLogoUrl = ref('');
const street = ref('');
const city = ref('');
const state = ref('');
const country = ref('');
const postalCode = ref('');

const errors = ref({
  storeName: '',
  storePhone: '',
  street: '',
  city: '',
  country: '',
  postalCode: '',
});

const showSuccessAlert = ref(false);

onMounted(async () => {
  if (!userStore.profile) {
    try {
      await userStore.fetchProfile();
    } catch (err) {
      console.error(err);
    }
  }

  if (userStore.profile) {
    storeName.value = userStore.profile.storeName || '';
    storeDescription.value = userStore.profile.storeDescription || '';
    storePhone.value = userStore.profile.storePhone || '';
    storeLogoUrl.value = userStore.profile.storeLogoUrl || '';
    if (userStore.profile.storeAddress) {
      street.value = userStore.profile.storeAddress.street || '';
      city.value = userStore.profile.storeAddress.city || '';
      state.value = userStore.profile.storeAddress.state || '';
      country.value = userStore.profile.storeAddress.country || '';
      postalCode.value = userStore.profile.storeAddress.postalCode || '';
    }
  }
});

const validateForm = (): boolean => {
  let isValid = true;
  
  errors.value = {
    storeName: '',
    storePhone: '',
    street: '',
    city: '',
    country: '',
    postalCode: '',
  };

  if (!storeName.value.trim()) {
    errors.value.storeName = 'Store name is required.';
    isValid = false;
  } else if (storeName.value.trim().length < 3) {
    errors.value.storeName = 'Store name must be at least 3 characters.';
    isValid = false;
  }

  // If any address field is provided, we validate the complete address block (except state)
  const hasAddress = street.value.trim() || city.value.trim() || state.value.trim() || country.value.trim() || postalCode.value.trim();
  if (hasAddress) {
    if (!street.value.trim()) {
      errors.value.street = 'Street street is required.';
      isValid = false;
    }
    if (!city.value.trim()) {
      errors.value.city = 'City is required.';
      isValid = false;
    }
    if (!country.value.trim()) {
      errors.value.country = 'Country is required.';
      isValid = false;
    }
    if (!postalCode.value.trim()) {
      errors.value.postalCode = 'Postal code is required.';
      isValid = false;
    }
  }

  return isValid;
};

const handleSaveSubmit = async () => {
  if (!validateForm()) return;
  
  const hasAddress = street.value.trim() || city.value.trim() || state.value.trim() || country.value.trim() || postalCode.value.trim();
  const storeAddress = hasAddress ? {
    street: street.value.trim(),
    city: city.value.trim(),
    state: state.value.trim(),
    country: country.value.trim(),
    postalCode: postalCode.value.trim(),
  } : undefined;

  try {
    showSuccessAlert.value = false;
    await userStore.updateProfile({
      storeName: storeName.value.trim(),
      storeDescription: storeDescription.value.trim(),
      storePhone: storePhone.value.trim() || undefined,
      storeLogoUrl: storeLogoUrl.value.trim() || undefined,
      storeAddress,
    });
    showSuccessAlert.value = true;
    emit('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error('Store profile form save error', err);
  }
};
</script>

<template>
  <div class="seller-profile-form">
    <BaseAlert
      v-if="userStore.error"
      type="error"
      :message="userStore.error"
      closable
    />

    <BaseAlert
      v-if="showSuccessAlert"
      type="success"
      message="Store profile changes saved successfully!"
      closable
      @close="showSuccessAlert = false"
    />

    <form @submit.prevent="handleSaveSubmit" novalidate class="form-layout">
      
      <!-- Identity Section -->
      <div class="form-section">
        <h3 class="section-title">Store Identity</h3>
        
        <BaseInput
          id="store-name"
          v-model="storeName"
          type="text"
          label="Store / Gallery Name"
          placeholder="e.g. Masterpiece Gallery"
          :error="errors.storeName"
          required
        />

        <div class="textarea-group">
          <label for="store-description" class="input-label">Store Description</label>
          <textarea
            id="store-description"
            v-model="storeDescription"
            rows="4"
            placeholder="Introduce your art, collections, and background to prospective collectors..."
            class="textarea-control"
          ></textarea>
        </div>
      </div>

      <!-- Branding Section -->
      <div class="form-section">
        <h3 class="section-title">Branding</h3>
        <SellerLogoUploader v-model="storeLogoUrl" :disabled="userStore.loading" />
      </div>

      <!-- Contact Section -->
      <div class="form-section">
        <h3 class="section-title">Contact & Location</h3>

        <BaseInput
          id="store-phone"
          v-model="storePhone"
          type="tel"
          label="Public Store Phone (Optional)"
          placeholder="+1 (555) 000-0000"
          :hint="'If left empty, your account phone ' + (userStore.profile?.phone || '') + ' will be shown by default'"
        />

        <!-- Address Block -->
        <div class="address-grid">
          <div class="full-width">
            <BaseInput
              id="store-street"
              v-model="street"
              type="text"
              label="Street Address"
              placeholder="e.g. 123 Gallery Walk"
              :error="errors.street"
            />
          </div>

          <BaseInput
            id="store-city"
            v-model="city"
            type="text"
            label="City"
            placeholder="e.g. Florence"
            :error="errors.city"
          />

          <BaseInput
            id="store-state"
            v-model="state"
            type="text"
            label="State / Province"
            placeholder="e.g. Tuscany"
          />

          <BaseInput
            id="store-country"
            v-model="country"
            type="text"
            label="Country"
            placeholder="e.g. Italy"
            :error="errors.country"
          />

          <BaseInput
            id="store-postal"
            v-model="postalCode"
            type="text"
            label="Postal / Zip Code"
            placeholder="e.g. 50123"
            :error="errors.postalCode"
          />
        </div>
      </div>

      <!-- Action buttons -->
      <div class="form-actions">
        <BaseButton
          type="button"
          variant="secondary"
          @click="$emit('cancel')"
          :disabled="userStore.loading"
        >
          Cancel
        </BaseButton>
        <BaseButton
          type="submit"
          :loading="userStore.loading"
        >
          Save Details
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.seller-profile-form {
  width: 100%;
}

.form-layout {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #ffffff;
  padding: 24px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.section-title {
  font-family: var(--font-sans);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-h);
  margin: 0 0 4px 0;
  text-align: left;
  border-left: 3px solid var(--color-primary);
  padding-left: 10px;
}

.textarea-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.input-label {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.textarea-control {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-h);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  resize: vertical;
}

.textarea-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(15, 61, 94, 0.12);
}

.address-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.full-width {
  grid-column: span 2;
}

.form-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .address-grid {
    grid-template-columns: 1fr;
  }
  .full-width {
    grid-column: span 1;
  }
}
</style>
