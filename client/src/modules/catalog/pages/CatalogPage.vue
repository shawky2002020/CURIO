<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProductStore } from '../../../stores/product.store.js';
import { useCategoryStore } from '../../../stores/category.store.js';
import { useWishlistStore } from '../../../stores/wishlist.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';
import ProductCard from '../components/ProductCard.vue';
import ProductFilterBar from '../components/ProductFilterBar.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import { Sparkles } from '@lucide/vue';

const productStore = useProductStore();
const categoryStore = useCategoryStore();
const wishlistStore = useWishlistStore();
const authStore = useAuthStore();

const filterBarRef = ref<InstanceType<typeof ProductFilterBar> | null>(null);

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories(),
    productStore.fetchProducts(),
    authStore.isAuthenticated ? wishlistStore.fetchWishlist().catch(() => {}) : Promise.resolve(),
  ]);
});

const handleFilterChange = (filters: {
  search: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
}) => {
  productStore.fetchProducts({
    search: filters.search || undefined,
    categoryId: filters.categoryId || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
  });
};

const resetAll = () => {
  filterBarRef.value?.resetFilters();
};
</script>

<template>
  <div class="catalog-view">
    <!-- Editorial Header -->
    <header class="page-header">
      <span class="page-eyebrow">CURIO EXQUISITE REGISTRY</span>
      <h1 class="page-title">Curated Objects</h1>
      <p class="page-subtitle">Discover a select collection of premium accessories, unique designs, and atelier items.</p>
    </header>

    <!-- Filter Bar -->
    <ProductFilterBar
      ref="filterBarRef"
      :categories="categoryStore.categories"
      :initial-filters="productStore.filters"
      @filter-change="handleFilterChange"
    />

    <!-- Loading State -->
    <div v-if="productStore.loading" class="catalog-loading">
      <div v-for="n in 6" :key="n" class="skeleton-card motion-shimmer"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="productStore.error" class="catalog-empty motion-scale-in">
      <div class="empty-icon-wrapper">
        <Sparkles class="empty-spark-icon" />
      </div>
      <h3 class="empty-title">Something went wrong</h3>
      <p class="empty-description">{{ productStore.error }}</p>
      <BaseButton variant="secondary" @click="productStore.fetchProducts()">Try Again</BaseButton>
    </div>

    <!-- Empty State -->
    <div v-else-if="productStore.products.length === 0" class="catalog-empty motion-scale-in">
      <div class="empty-icon-wrapper">
        <Sparkles class="empty-spark-icon" />
      </div>
      <h3 class="empty-title">No matching objects found</h3>
      <p class="empty-description">
        We could not find any items matching your query. Try resetting your filters or modifying your search text.
      </p>
      <BaseButton variant="secondary" @click="resetAll">Reset Filters</BaseButton>
    </div>

    <!-- Product Grid -->
    <section v-else class="catalog-grid-section" aria-label="Curated Collection Grid">
      <div class="catalog-grid">
        <ProductCard
          v-for="product in productStore.products"
          :key="product._id"
          :product="product"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.catalog-view {
  width: 100%;
}

.page-header {
  margin-bottom: 40px;
  text-align: left;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 24px;
}

.page-eyebrow {
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: var(--color-accent);
  display: block;
  margin-bottom: 6px;
}

.page-title {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-family: var(--font-sans);
  font-size: 1rem;
  color: var(--color-muted);
  margin: 0;
}

/* Skeleton Loading Grid */
.catalog-loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}

.skeleton-card {
  height: 420px;
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-alt);
}

/* Product Grid */
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}

/* Empty / Error State */
.catalog-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 40px;
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  max-width: 500px;
  margin: 0 auto;
  box-sizing: border-box;
}

.empty-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: rgba(255, 190, 11, 0.08);
  color: var(--color-accent-2);
  margin-bottom: 24px;
}

.empty-spark-icon {
  width: 32px;
  height: 32px;
}

.empty-title {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 12px 0;
}

.empty-description {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0 0 28px 0;
  max-width: 380px;
}
</style>
