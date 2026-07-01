<script setup lang="ts">
import { ref, watch } from 'vue';
import { UploadCloud, Link as LinkIcon, Trash2 } from '@lucide/vue';
import { useUserStore } from '../../../stores/user.store.js';

interface Props {
  modelValue: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const userStore = useUserStore();
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const error = ref<string | null>(null);
const uploading = ref(false);

const localUrl = ref(props.modelValue);
watch(() => props.modelValue, (newVal) => {
  localUrl.value = newVal;
});

const onUrlInput = (val: string) => {
  localUrl.value = val;
  emit('update:modelValue', val);
  error.value = null;
};

const triggerFileInput = () => {
  if (props.disabled || uploading.value) return;
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
    error.value = 'File size exceeds 2MB limit.';
    return false;
  }
  return true;
};

const handleUpload = async (file: File) => {
  if (!validateFile(file)) return;
  uploading.value = true;
  try {
    const uploadedUrl = await userStore.uploadLogo(file);
    localUrl.value = uploadedUrl;
    emit('update:modelValue', uploadedUrl);
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'File upload failed.';
  } finally {
    uploading.value = false;
  }
};

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    handleUpload(target.files[0]);
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
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    handleUpload(e.dataTransfer.files[0]);
  }
};

const removeLogo = () => {
  localUrl.value = '';
  emit('update:modelValue', '');
  error.value = null;
};
</script>

<template>
  <div class="logo-uploader-container">
    <label class="uploader-label">
      Store Logo
    </label>

    <div class="uploader-body">
      <!-- Image Preview & Drag Area -->
      <div 
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
          class="hidden-file-input"
          @change="onFileChange"
          :disabled="disabled || uploading"
        />

        <div v-if="localUrl" class="preview-wrapper" @click.stop>
          <img :src="localUrl" alt="Store Logo Preview" class="logo-preview-image" />
          <button 
            v-if="!disabled" 
            type="button" 
            class="remove-btn" 
            @click="removeLogo"
            title="Remove logo"
          >
            <Trash2 class="btn-icon" />
          </button>
        </div>

        <div v-else-if="uploading" class="uploading-state">
          <div class="spinner"></div>
          <p class="state-text">Uploading to Cloudinary...</p>
        </div>

        <div v-else class="placeholder-state">
          <UploadCloud class="upload-icon" />
          <p class="upload-text">Drag & drop your logo here, or <span class="browse-link">browse</span></p>
          <p class="upload-hint">Supports PNG, JPG up to 2MB</p>
        </div>
      </div>

      <!-- Direct URL Input -->
      <div class="url-input-wrapper">
        <div class="url-input-label">
          <LinkIcon class="link-icon" />
          <span>Or provide direct image URL</span>
        </div>
        <input 
          type="text"
          :value="localUrl"
          @input="onUrlInput(($event.target as HTMLInputElement).value)"
          placeholder="https://example.com/logo.png"
          class="url-input-field"
          :disabled="disabled || uploading"
        />
      </div>
    </div>

    <!-- Error Messaging -->
    <p v-if="error" class="uploader-error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.logo-uploader-container {
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
  gap: 12px;
}

.preview-dropzone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px;
  text-align: center;
  background-color: var(--color-surface);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 140px;
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

.preview-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 120px;
  max-height: 120px;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-border);
}

.logo-preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #fff;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(239, 68, 68, 0.9);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
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
  width: 14px;
  height: 14px;
}

.placeholder-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.upload-icon {
  width: 32px;
  height: 32px;
  color: var(--color-muted);
}

.upload-text {
  font-family: var(--font-sans);
  font-size: 0.9rem;
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
  font-size: 0.775rem;
  color: var(--color-muted);
  margin: 0;
}

.uploading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  border: 3px solid rgba(15, 61, 94, 0.1);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.state-text {
  font-family: var(--font-sans);
  font-size: 0.875rem;
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
  width: 100%;
}

.url-input-field:focus {
  outline: none;
  border-color: var(--color-primary);
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
