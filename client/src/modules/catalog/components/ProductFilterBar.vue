<script setup lang="ts">
import { ref, watch } from 'vue';
import { Search, SlidersHorizontal } from '@lucide/vue';
import type { Category } from '../../../types/product.types.js';

const props = defineProps<{
  categories: Category[];
  initialFilters?: {
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
  };
}>();

const emit = defineEmits<{
  (e: 'filter-change', filters: {
    search: string;
    categoryId: string;
    minPrice: string;
    maxPrice: string;
  }): void;
}>();

const search = ref(props.initialFilters?.search || '');
const activeCategoryId = ref(props.initialFilters?.categoryId || '');
const minPrice = ref(props.initialFilters?.minPrice?.toString() || '');
const maxPrice = ref(props.initialFilters?.maxPrice?.toString() || '');

let debounceTimer: ReturnType<typeof setTimeout>;

const emitFilters = () => {
  emit('filter-change', {
    search: search.value,
    categoryId: activeCategoryId.value,
    minPrice: minPrice.value,
    maxPrice: maxPrice.value,
  });
};

// Debounce search input
watch(search, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(emitFilters, 350);
});

watch([activeCategoryId, minPrice, maxPrice], emitFilters);

const setCategory = (id: string) => {
  activeCategoryId.value = activeCategoryId.value === id ? '' : id;
};

const resetFilters = () => {
  search.value = '';
  activeCategoryId.value = '';
  minPrice.value = '';
  maxPrice.value = '';
  emitFilters();
};

const setCategoryIdExternal = (id: string) => {
  activeCategoryId.value = id;
};

defineExpose({ resetFilters, setCategoryIdExternal });
</script>

<template>
  <section class="filter-bar" aria-label="Filters and Search">
    <!-- Search Input -->
    <div class="search-box">
      <Search class="search-icon" aria-hidden="true" />
      <input
        v-model="search"
        type="text"
        placeholder="Search collections, materials, names..."
        class="search-input"
        aria-label="Search catalog"
        id="catalog-search"
      />
    </div>

    <!-- Price Range -->
    <div class="price-range-row">
      <SlidersHorizontal class="filter-icon" aria-hidden="true" />
      <input
        v-model="minPrice"
        type="number"
        placeholder="Min $"
        class="price-input"
        aria-label="Minimum price"
        id="filter-min-price"
        min="0"
      />
      <span class="price-separator">—</span>
      <input
        v-model="maxPrice"
        type="number"
        placeholder="Max $"
        class="price-input"
        aria-label="Maximum price"
        id="filter-max-price"
        min="0"
      />
    </div>

    <!-- Category Tabs -->
    <nav class="category-tabs" aria-label="Catalog category filter">
      <button
        :class="['category-tab', { 'category-tab--active': activeCategoryId === '' }]"
        @click="setCategory('')"
      >
        All
      </button>
      <button
        v-for="cat in categories"
        :key="cat._id"
        :class="['category-tab', { 'category-tab--active': activeCategoryId === cat._id }]"
        @click="setCategory(cat._id)"
      >
        {{ cat.name }}
      </button>
    </nav>
  </section>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 48px;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 500px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 16px;
  width: 18px;
  height: 18px;
  color: var(--color-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  transition: all var(--duration-base) var(--ease-out);
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(15, 61, 94, 0.08);
}

.price-range-row {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 340px;
}

.filter-icon {
  width: 18px;
  height: 18px;
  color: var(--color-muted);
  flex-shrink: 0;
}

.price-input {
  width: 110px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  transition: all var(--duration-base) var(--ease-out);
  box-sizing: border-box;
}

.price-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(15, 61, 94, 0.08);
}

.price-separator {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--color-muted);
}

.category-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.category-tab {
  background-color: var(--color-bg-alt);
  color: var(--color-primary);
  border: 1px solid var(--color-border);
  font-family: var(--font-display);
  font-size: 0.825rem;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-spring);
}

.category-tab:hover {
  color: var(--color-accent);
  background-color: var(--color-surface);
}

.category-tab--active {
  background-color: var(--color-primary) !important;
  color: var(--color-surface) !important;
  border-color: var(--color-primary) !important;
}
</style>
