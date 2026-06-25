<script setup lang="ts">
// Reusable UI Input
defineProps<{
  modelValue: string;
  label?: string;
  type?: string;
  placeholder?: string;
  error?: string;
  id?: string;
  required?: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <div class="input-group">
    <label v-if="label" :for="id" class="label">{{ label }}<span v-if="required" class="req">*</span></label>
    <input
      :id="id"
      :type="type || 'text'"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :placeholder="placeholder"
      :class="['input', { 'input-error': !!error }]"
    />
    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1.25rem;
  width: 100%;
}

.label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #9ca3af;
}

.req {
  color: #ef4444;
  margin-left: 0.25rem;
}

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f3f4f6;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  background-color: rgba(255, 255, 255, 0.05);
}

.input-error {
  border-color: #ef4444;
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.error-msg {
  font-size: 0.8rem;
  color: #ef4444;
  margin-top: 0.125rem;
}
</style>
