<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useCategoryStore } from '../../../stores/category.store.js';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseInput from '../../../components/ui/BaseInput.vue';
import BaseSelect from '../../../components/ui/BaseSelect.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';
import SellerProductImageUploader from './SellerProductImageUploader.vue';
import type { Product } from '../../../types/product.types.js';

interface Props {
  product?: Product | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  product: null,
  loading: false,
});

const emit = defineEmits<{
  (e: 'submit', payload: { form: any; files: File[] }): void;
  (e: 'cancel'): void;
}>();

const categoryStore = useCategoryStore();

const form = ref({
  name: '',
  description: '',
  price: 0,
  stock: 0,
  categoryId: '',
  discount: 0,
  status: 'draft' as 'draft' | 'active',
  images: [] as string[],
});

const pendingFiles = ref<File[]>([]);
const errors = ref<Record<string, string>>({});

onMounted(async () => {
  if (categoryStore.categories.length === 0) {
    await categoryStore.fetchCategories();
  }
});

watch(
  () => props.product,
  (newVal) => {
    if (newVal) {
      form.value = {
        name: newVal.name,
        description: newVal.description,
        price: newVal.price,
        stock: newVal.stock,
        categoryId: newVal.categoryId?._id || '',
        discount: newVal.discount || 0,
        status: newVal.status === 'archived' ? 'draft' : newVal.status,
        images: [...newVal.images],
      };
      pendingFiles.value = [];
      errors.value = {};
    } else {
      form.value = {
        name: '',
        description: '',
        price: 0,
        stock: 0,
        categoryId: '',
        discount: 0,
        status: 'draft',
        images: [],
      };
      pendingFiles.value = [];
      errors.value = {};
    }
  },
  { immediate: true }
);

const onFilesChange = (files: File[]) => {
  pendingFiles.value = files;
  if (errors.value.images && (form.value.images.length + files.length > 0)) {
    delete errors.value.images;
  }
};

const handleDiscountInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  form.value.discount = val === '' ? 0 : Number(val);
};

const handleSubmit = () => {
  errors.value = {};

  // Pre-process and validate discount
  const discRaw = form.value.discount;
  const parsedDiscount = Math.floor(Number(discRaw));
  
  if (isNaN(parsedDiscount) || !Number.isInteger(Number(discRaw)) || parsedDiscount < 0 || parsedDiscount > 99) {
    errors.value.discount = 'Discount must be a whole number between 0 and 99.';
  } else {
    form.value.discount = parsedDiscount;
  }

  // Basic validations
  if (!form.value.name.trim()) errors.value.name = 'Name is required.';
  if (!form.value.description.trim()) errors.value.description = 'Description is required.';
  else if (form.value.description.length < 10) errors.value.description = 'Description must be at least 10 characters.';
  
  if (form.value.price <= 0) errors.value.price = 'Price must be greater than 0.';
  if (form.value.stock < 0) errors.value.stock = 'Stock cannot be negative.';
  if (!form.value.categoryId) errors.value.categoryId = 'Category is required.';

  // Publish-gate check: if publishing, must have at least one image
  if (form.value.status === 'active') {
    const totalImages = form.value.images.length + pendingFiles.value.length;
    if (totalImages === 0) {
      errors.value.images = 'At least one image is required to publish a product.';
    }
  }

  if (Object.keys(errors.value).length > 0) {
    return;
  }

  // Emit submit event to parent
  emit('submit', {
    form: { ...form.value },
    files: pendingFiles.value,
  });
};

const categoryOptions = ref<any[]>([]);
watch(
  () => categoryStore.categories,
  (list) => {
    categoryOptions.value = list.map((c) => ({
      label: c.name,
      value: c._id,
    }));
  },
  { immediate: true }
);
</script>

<template>
  <form @submit.prevent="handleSubmit" class="seller-product-form">
    <!-- General Errors Alert -->
    <BaseAlert
      v-if="Object.keys(errors).length > 0"
      type="error"
      message="Please correct the validation errors in the form before submitting."
      class="mb-4"
    />

    <div class="form-grid">
      <!-- Left side: General details -->
      <div class="form-column">
        <div class="form-group">
          <BaseInput
            label="Product Name"
            v-model="form.name"
            placeholder="e.g. Handmade Ceramic Vase"
            :error="errors.name"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Description <span class="required">*</span></label>
          <textarea
            v-model="form.description"
            rows="5"
            placeholder="Describe your product's materials, craftsmanship, dimensions..."
            class="textarea-field"
            :class="{ 'has-error': errors.description }"
            required
            :disabled="loading"
          ></textarea>
          <p v-if="errors.description" class="error-msg">{{ errors.description }}</p>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Price ($) <span class="required">*</span></label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              v-model.number="form.price"
              class="input-field"
              :class="{ 'has-error': errors.price }"
              required
              :disabled="loading"
            />
            <p v-if="errors.price" class="error-msg">{{ errors.price }}</p>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Stock Quantity <span class="required">*</span></label>
            <input
              type="number"
              step="1"
              min="0"
              v-model.number="form.stock"
              class="input-field"
              :class="{ 'has-error': errors.stock }"
              required
              :disabled="loading"
            />
            <p v-if="errors.stock" class="error-msg">{{ errors.stock }}</p>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <BaseSelect
              label="Category"
              v-model="form.categoryId"
              :options="categoryOptions"
              placeholder="Choose category"
              :error="errors.categoryId"
              required
              :disabled="loading"
            />
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Discount (%)</label>
            <input
              type="number"
              step="1"
              min="0"
              max="99"
              :value="form.discount"
              @input="handleDiscountInput"
              class="input-field"
              :class="{ 'has-error': errors.discount }"
              :disabled="loading"
            />
            <p class="hint-text">Whole number percentage discount (0-99%)</p>
            <p v-if="errors.discount" class="error-msg">{{ errors.discount }}</p>
          </div>
        </div>
      </div>

      <!-- Right side: Images & Status -->
      <div class="form-column">
        <!-- Image Uploader component -->
        <div class="form-group">
          <SellerProductImageUploader
            v-model="form.images"
            :productId="product?._id"
            @change-files="onFilesChange"
            :disabled="loading"
          />
          <p v-if="errors.images" class="error-msg">{{ errors.images }}</p>
        </div>

        <div class="form-group status-box">
          <label class="form-label">Product Visibility</label>
          <div class="toggle-container">
            <label class="radio-label">
              <input
                type="radio"
                v-model="form.status"
                value="draft"
                name="form-status"
                :disabled="loading"
              />
              <div class="radio-custom">
                <span class="title">Draft</span>
                <span class="desc">Only visible to you, edit at any time</span>
              </div>
            </label>

            <label class="radio-label">
              <input
                type="radio"
                v-model="form.status"
                value="active"
                name="form-status"
                :disabled="loading"
              />
              <div class="radio-custom">
                <span class="title">Active / Publish</span>
                <span class="desc">Instantly list on the public marketplace</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Footer -->
    <div class="form-actions">
      <BaseButton
        type="button"
        variant="ghost"
        @click="emit('cancel')"
        :disabled="loading"
      >
        Cancel
      </BaseButton>

      <BaseButton
        type="submit"
        variant="primary"
        :loading="loading"
      >
        {{ product ? 'Save Changes' : 'Create Product' }}
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
.seller-product-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: 1.1fr 0.9fr;
  }
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: row;
  gap: 16px;
  flex-wrap: wrap;
}

.flex-1 {
  flex: 1;
  min-width: 150px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.form-label {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.required {
  color: var(--color-error);
}

.textarea-field,
.input-field {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-h);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  width: 100%;
}

.textarea-field:focus,
.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
}

.textarea-field.has-error,
.input-field.has-error {
  border-color: var(--color-error);
}

.error-msg {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--color-error);
  font-weight: 500;
  margin: 0;
}

.hint-text {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--color-muted);
  margin: 0;
}

.status-box {
  background-color: rgba(15, 61, 94, 0.015);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-top: 4px;
}

.toggle-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 6px;
}

.radio-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  position: relative;
}

.radio-label input[type='radio'] {
  margin-top: 4px;
  accent-color: var(--color-primary);
}

.radio-custom {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.radio-custom .title {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-h);
}

.radio-custom .desc {
  font-family: var(--font-sans);
  font-size: 0.775rem;
  color: var(--color-muted);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--color-border);
  padding-top: 20px;
  margin-top: 10px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
