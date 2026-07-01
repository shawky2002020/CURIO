<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { UploadCloud, Link as LinkIcon, Trash2 } from '@lucide/vue';
import { useSellerProductStore } from '../../../stores/sellerProduct.store.js';

interface Props {
  modelValue: string[]; // Existing Cloudinary URLs
  productId?: string;   // Optional, if editing an existing product
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  productId: '',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
  (e: 'change-files', files: File[]): void;
}>();

const sellerProductStore = useSellerProductStore();
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const error = ref<string | null>(null);
const uploading = ref(false);

// Local pending files (for product creation mode)
const localFiles = ref<File[]>([]);
const localPreviews = ref<string[]>([]);

// Clean up object URLs to prevent memory leaks
const revokePreviews = () => {
  localPreviews.value.forEach((url) => URL.revokeObjectURL(url));
  localPreviews.value = [];
};

onUnmounted(() => {
  revokePreviews();
});

const triggerFileInput = () => {
  if (props.disabled || uploading.value) return;
  const currentTotal = props.modelValue.length + localFiles.value.length;
  if (currentTotal >= 5) {
    error.value = 'You can upload a maximum of 5 images per product.';
    return;
  }
  fileInput.value?.click();
};

const validateFile = (file: File): boolean => {
  error.value = null;
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    error.value = 'Only PNG and JPG images are supported.';
    return false;
  }
  if (file.size > 2 * 1024 * 1024) {
    error.value = 'Each file must not exceed 2MB.';
    return false;
  }
  return true;
};

const handleAddFile = async (file: File) => {
  if (!validateFile(file)) return;

  const currentTotal = props.modelValue.length + localFiles.value.length;
  if (currentTotal >= 5) {
    error.value = 'You can upload a maximum of 5 images per product.';
    return;
  }

  if (props.productId) {
    // Edit mode: upload immediately to Cloudinary
    uploading.value = true;
    try {
      await sellerProductStore.uploadImages(props.productId, [file]);
      // The store updates the local product, but we should make sure the form reflects it
      const updatedProduct = sellerProductStore.products.find(p => p._id === props.productId);
      if (updatedProduct) {
        emit('update:modelValue', updatedProduct.images);
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Image upload failed.';
    } finally {
      uploading.value = false;
    }
  } else {
    // Create mode: add to pending files queue
    localFiles.value.push(file);
    localPreviews.value.push(URL.createObjectURL(file));
    emit('change-files', localFiles.value);
  }
};

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    Array.from(target.files).forEach((file) => {
      handleAddFile(file);
    });
  }
  // Clear the input value so the same file can be selected again
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const onDragOver = (e: DragEvent) => {
  if (props.disabled) return;
  e.preventDefault();
  isDragging.value = true;
};

const onDragLeave = () => {
  isDragging.value = false;
};

const onDrop = (e: DragEvent) => {
  if (props.disabled) return;
  e.preventDefault();
  isDragging.value = false;
  if (e.dataTransfer?.files) {
    Array.from(e.dataTransfer.files).forEach((file) => {
      handleAddFile(file);
    });
  }
};

const removeExistingImage = (index: number) => {
  const updated = [...props.modelValue];
  updated.splice(index, 1);
  emit('update:modelValue', updated);
};

const removePendingFile = (index: number) => {
  URL.revokeObjectURL(localPreviews.value[index]);
  localFiles.value.splice(index, 1);
  localPreviews.value.splice(index, 1);
  emit('change-files', localFiles.value);
};

const directUrlInput = ref('');
const addDirectUrl = () => {
  error.value = null;
  const url = directUrlInput.value.trim();
  if (!url) return;

  const currentTotal = props.modelValue.length + localFiles.value.length;
  if (currentTotal >= 5) {
    error.value = 'You can upload a maximum of 5 images per product.';
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    error.value = 'Please provide a valid image URL starting with http:// or https://';
    return;
  }

  const updated = [...props.modelValue, url];
  emit('update:modelValue', updated);
  directUrlInput.value = '';
};

// Reset queue when props change or clear
watch(() => props.productId, (newVal) => {
  if (newVal) {
    // If we transition to edit mode, clean up create-mode files
    localFiles.value = [];
    revokePreviews();
  }
});
</script>

<template>
  <div class="product-uploader-container">
    <label class="uploader-label">
      Product Images ({{ modelValue.length + localFiles.length }} / 5)
    </label>

    <div class="uploader-body">
      <!-- Grid of Previews -->
      <div v-if="modelValue.length > 0 || localFiles.length > 0" class="previews-grid">
        <!-- Existing remote images -->
        <div v-for="(img, idx) in modelValue" :key="'remote-' + idx" class="preview-card">
          <img :src="img" alt="Product Image" class="preview-image" />
          <span v-if="idx === 0" class="badge-primary">Primary</span>
          <button 
            v-if="!disabled"
            type="button" 
            class="remove-btn" 
            @click="removeExistingImage(idx)"
            title="Remove image"
          >
            <Trash2 class="btn-icon" />
          </button>
        </div>

        <!-- Pending local images -->
        <div v-for="(preview, idx) in localPreviews" :key="'local-' + idx" class="preview-card pending">
          <img :src="preview" alt="Pending upload" class="preview-image" />
          <span v-if="modelValue.length + idx === 0" class="badge-primary">Primary</span>
          <span class="badge-pending">Pending Upload</span>
          <button 
            v-if="!disabled"
            type="button" 
            class="remove-btn" 
            @click="removePendingFile(idx)"
            title="Remove image"
          >
            <Trash2 class="btn-icon" />
          </button>
        </div>
      </div>

      <!-- Drag & Drop Zone -->
      <div 
        v-if="modelValue.length + localFiles.length < 5"
        class="preview-dropzone"
        :class="{ 'dragging': isDragging, 'disabled': disabled || uploading }"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @click="triggerFileInput"
      >
        <input 
          ref="fileInput"
          type="file"
          accept="image/png, image/jpeg"
          multiple
          class="hidden-file-input"
          @change="onFileChange"
          :disabled="disabled || uploading"
        />

        <div v-if="uploading" class="uploading-state">
          <div class="spinner"></div>
          <p class="state-text">Uploading to Cloudinary...</p>
        </div>

        <div v-else class="placeholder-state">
          <UploadCloud class="upload-icon" />
          <p class="upload-text">Drag & drop files here, or <span class="browse-link">browse</span></p>
          <p class="upload-hint">Supports PNG, JPG up to 2MB per file (max 5 images)</p>
        </div>
      </div>

      <!-- Direct URL Input -->
      <div v-if="modelValue.length + localFiles.length < 5" class="url-input-wrapper">
        <div class="url-input-label">
          <LinkIcon class="link-icon" />
          <span>Or add image by URL</span>
        </div>
        <div class="url-input-row">
          <input 
            type="text"
            v-model="directUrlInput"
            placeholder="https://example.com/product-image.png"
            class="url-input-field"
            :disabled="disabled || uploading"
            @keydown.enter.prevent="addDirectUrl"
          />
          <button 
            type="button" 
            class="add-url-btn" 
            @click="addDirectUrl"
            :disabled="disabled || uploading || !directUrlInput.trim()"
          >
            Add
          </button>
        </div>
      </div>
    </div>

    <!-- Error Messaging -->
    <p v-if="error" class="uploader-error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.product-uploader-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  margin-bottom: 20px;
}

.uploader-label {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  text-align: left;
}

.uploader-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.previews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

.preview-card {
  position: relative;
  height: 110px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  background-color: var(--color-surface);
}

.preview-card.pending {
  border-style: dashed;
  border-color: var(--color-primary);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-primary {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background-color: var(--color-primary);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.badge-pending {
  position: absolute;
  top: 4px;
  left: 4px;
  background-color: rgba(15, 61, 94, 0.8);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(239, 68, 68, 0.9);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background-color: rgb(220, 38, 38);
}

.btn-icon {
  width: 12px;
  height: 12px;
}

.preview-dropzone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px;
  text-align: center;
  background-color: var(--color-surface);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preview-dropzone:hover {
  border-color: var(--color-primary);
  background-color: rgba(15, 61, 94, 0.02);
}

.preview-dropzone.dragging {
  border-color: var(--color-primary);
  background-color: rgba(15, 61, 94, 0.05);
}

.preview-dropzone.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.hidden-file-input {
  display: none;
}

.placeholder-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.upload-icon {
  width: 28px;
  height: 28px;
  color: var(--color-muted);
}

.upload-text {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--color-text-h);
  margin: 0;
}

.browse-link {
  color: var(--color-primary);
  text-decoration: underline;
  font-weight: 600;
}

.upload-hint {
  font-family: var(--font-sans);
  font-size: 0.725rem;
  color: var(--color-muted);
  margin: 0;
}

.uploading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.spinner {
  border: 3px solid rgba(15, 61, 94, 0.1);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.state-text {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--color-text);
  margin: 0;
}

.url-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.url-input-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-muted);
}

.link-icon {
  width: 14px;
  height: 14px;
}

.url-input-row {
  display: flex;
  gap: 8px;
}

.url-input-field {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-h);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  flex: 1;
}

.url-input-field:focus {
  outline: none;
  border-color: var(--color-primary);
}

.add-url-btn {
  padding: 10px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-primary);
  background-color: var(--color-primary);
  color: #fff;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-url-btn:hover:not(:disabled) {
  background-color: #0d3451;
}

.add-url-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.uploader-error {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--color-error);
  font-weight: 500;
  margin: 0;
  text-align: left;
}
</style>
