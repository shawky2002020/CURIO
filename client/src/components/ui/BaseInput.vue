<script setup lang="ts">
import { ref, computed } from 'vue';
import { Eye, EyeOff } from '@lucide/vue';

/**
 * BaseInput Component
 * A robust, accessible text input supporting type-safe props, hints, and password toggling.
 */
interface Props {
  modelValue: string;
  label?: string;
  type?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  autocomplete?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  error: '',
  hint: '',
  required: false,
  disabled: false,
  autocomplete: 'off',
});

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// Password visibility state
const isPasswordVisible = ref(false);

// Compute active input type
const currentInputType = computed(() => {
  if (props.type === 'password') {
    return isPasswordVisible.value ? 'text' : 'password';
  }
  return props.type;
});

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value;
};
</script>

<template>
  <div class="base-input-group" :class="{ 'input-disabled': disabled }">
    <!-- Field Label -->
    <label
      v-if="label"
      :for="id"
      class="input-label"
    >
      {{ label }}
      <span v-if="required" class="required-indicator" aria-hidden="true">*</span>
    </label>

    <div class="input-wrapper">
      <!-- Input Control -->
      <input
        :id="id"
        :type="currentInputType"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
        :class="['input-control', { 'input-has-error': !!error, 'input-is-password': type === 'password' }]"
      />

      <!-- Password Visibility Toggle Icon -->
      <button
        v-if="type === 'password'"
        type="button"
        class="password-toggle"
        @click="togglePasswordVisibility"
        :aria-label="isPasswordVisible ? 'Hide password' : 'Show password'"
        tabindex="0"
      >
        <!-- Lucide Icons for Password Visibility -->
        <EyeOff v-if="isPasswordVisible" class="toggle-icon" aria-hidden="true" />
        <Eye v-else class="toggle-icon" aria-hidden="true" />
      </button>
    </div>

    <!-- Help/Hint Text -->
    <p v-if="hint && !error" :id="`${id}-hint`" class="input-hint">
      {{ hint }}
    </p>

    <!-- Error Message -->
    <p v-if="error" :id="`${id}-error`" class="input-error-msg" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.base-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  width: 100%;
  text-align: left;
}

.input-label {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.required-indicator {
  color: var(--color-error);
  margin-left: 2px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-control {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-h);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.input-control::placeholder {
  color: var(--color-muted);
  opacity: 0.8;
}

.input-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(15, 61, 94, 0.12);
}

.input-is-password {
  padding-right: 48px; /* Safe space for visibility toggle */
}

/* Error States */
.input-has-error {
  border-color: var(--color-error) !important;
}

.input-has-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) !important;
}

/* Disabled States */
.input-disabled {
  opacity: 0.6;
}

.input-control:disabled {
  background-color: var(--color-bg);
  cursor: not-allowed;
}

/* Password Toggle styles using custom clean CSS icons */
.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-muted);
  border-radius: 50%;
  transition: background-color 0.2s;
}

.password-toggle:hover {
  background-color: rgba(15, 61, 94, 0.06);
}

.password-toggle:focus-visible {
  outline: 2px solid var(--color-accent);
}

.toggle-icon {
  width: 18px;
  height: 18px;
  color: currentColor;
}

.input-hint {
  font-size: 0.8rem;
  color: var(--color-muted);
  margin: 0;
}

.input-error-msg {
  font-size: 0.825rem;
  color: var(--color-error);
  font-weight: 500;
  margin: 0;
}
</style>
