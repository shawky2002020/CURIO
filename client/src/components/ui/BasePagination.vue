<script setup lang="ts">
/**
 * BasePagination Component
 * Reusable pagination controller component using CURIO design system.
 */
import { ChevronLeft, ChevronRight } from '@lucide/vue';

interface Props {
  currentPage: number;
  totalPages: number;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'change', page: number): void;
}>();

const onPageChange = (page: number) => {
  emit('change', page);
};
</script>

<template>
  <footer class="pagination-container" v-if="totalPages > 1">
    <span class="pagination-summary">
      Showing Page <strong>{{ currentPage }}</strong> of <strong>{{ totalPages }}</strong>
    </span>
    <div class="pagination-navigation">
      <button
        type="button"
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="onPageChange(currentPage - 1)"
      >
        <ChevronLeft class="nav-icon" /> Prev
      </button>
      <button
        type="button"
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="onPageChange(currentPage + 1)"
      >
        Next <ChevronRight class="nav-icon" />
      </button>
    </div>
  </footer>
</template>

<style scoped>
.pagination-container {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--color-border);
  box-sizing: border-box;
}

.pagination-summary {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--color-muted);
}

.pagination-navigation {
  display: flex;
  gap: 8px;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--color-bg-alt);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-btn .nav-icon {
  width: 14px;
  height: 14px;
}
</style>
