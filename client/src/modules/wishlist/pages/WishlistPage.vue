<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useWishlistStore } from '../../../stores/wishlist.store.js';
import { useCategoryStore } from '../../../stores/category.store.js';
import WishlistEmptyState from '../components/WishlistEmptyState.vue';
import BaseLoader from '../../../components/ui/BaseLoader.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import { Search, X } from '@lucide/vue';

const wishlistStore = useWishlistStore();
const categoryStore = useCategoryStore();
const router = useRouter();
const removingId = ref<string | null>(null);

// Filter state
const searchQuery = ref('');
const activeCategoryId = ref('');

// Load wishlist + categories on mount
onMounted(async () => {
  try {
    await Promise.all([
      wishlistStore.fetchWishlist(),
      categoryStore.fetchCategories(),
    ]);
  } catch (err) {
    console.error('Failed to fetch wishlist or categories', err);
  }
});

// Filtered wishlist items
const filteredItems = computed(() => {
  if (!wishlistStore.wishlist) return [];
  let items = wishlistStore.wishlist.items;

  // Filter by search query (name or description)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    items = items.filter((item) => {
      const product = item.productId;
      if (!product || typeof product !== 'object') return false;
      return (
        product.name?.toLowerCase().includes(q) ||
        product.description?.toLowerCase().includes(q)
      );
    });
  }

  // Filter by category
  if (activeCategoryId.value) {
    items = items.filter((item) => {
      const product = item.productId;
      if (!product || typeof product !== 'object') return false;
      const catId = typeof product.categoryId === 'object' ? product.categoryId._id : product.categoryId;
      return catId === activeCategoryId.value;
    });
  }

  return items;
});

// Get unique categories from wishlisted products
const wishlistCategories = computed(() => {
  if (!wishlistStore.wishlist) return [];
  const catMap = new Map<string, string>();
  for (const item of wishlistStore.wishlist.items) {
    const product = item.productId;
    if (!product || typeof product !== 'object') continue;
    const cat = product.categoryId as any;
    if (cat && typeof cat === 'object' && cat._id && cat.name) {
      catMap.set(cat._id, cat.name);
    }
  }
  return Array.from(catMap.entries()).map(([id, name]) => ({ _id: id, name }));
});

const setCategory = (id: string) => {
  activeCategoryId.value = activeCategoryId.value === id ? '' : id;
};

const clearFilters = () => {
  searchQuery.value = '';
  activeCategoryId.value = '';
};

const hasActiveFilters = computed(() => !!searchQuery.value.trim() || !!activeCategoryId.value);

const handleRemoveItem = async (productId: string) => {
  removingId.value = productId;
  try {
    await wishlistStore.removeFromWishlist(productId);
  } catch (err) {
    console.error(err);
  } finally {
    removingId.value = null;
  }
};

const navigateToProduct = (productId: string) => {
  router.push({ name: 'product-detail', params: { id: productId } });
};
</script>

<template>
  <div class="wishlist-view">
    <header class="page-header">
      <span class="page-eyebrow">PORTAL WISHLIST ARCHIVE</span>
      <h1 class="page-title">Your Curation</h1>
      <p class="page-subtitle">Save items you love here to easily track, acquire, or share them later.</p>
    </header>

    <!-- 1. Loading State -->
    <BaseLoader v-if="wishlistStore.loading && !removingId" text="Retrieving archived curations..." />
    
    <!-- 2. Error State -->
    <BaseAlert v-else-if="wishlistStore.error" type="error" :message="wishlistStore.error" />

    <!-- 3. Success State -->
    <div v-else class="wishlist-container motion-scale-in">
      <!-- Empty State -->
      <WishlistEmptyState v-if="!wishlistStore.wishlist || wishlistStore.wishlist.items.length === 0" />

      <!-- Active Wishlist -->
      <template v-else>
        <!-- Filter Bar -->
        <section class="wishlist-filters" aria-label="Wishlist Filters">
          <div class="search-box">
            <Search class="search-icon" aria-hidden="true" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search your curated items..."
              class="search-input"
              aria-label="Search wishlist"
            />
            <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''" aria-label="Clear search">
              <X :size="16" />
            </button>
          </div>

          <nav v-if="wishlistCategories.length > 1" class="category-tabs" aria-label="Filter by category">
            <button
              :class="['category-tab', { 'category-tab--active': activeCategoryId === '' }]"
              @click="setCategory('')"
            >
              All
            </button>
            <button
              v-for="cat in wishlistCategories"
              :key="cat._id"
              :class="['category-tab', { 'category-tab--active': activeCategoryId === cat._id }]"
              @click="setCategory(cat._id)"
            >
              {{ cat.name }}
            </button>
          </nav>
        </section>

        <!-- Filtered Empty State -->
        <div v-if="filteredItems.length === 0 && hasActiveFilters" class="filter-empty motion-scale-in">
          <h3 class="filter-empty-title">No items match your filter</h3>
          <p class="filter-empty-desc">Try adjusting your search or category selection.</p>
          <BaseButton variant="secondary" size="sm" @click="clearFilters">Reset Filters</BaseButton>
        </div>

        <!-- Wishlist Grid -->
        <div v-else class="wishlist-grid-layout">
          <div
            v-for="item in filteredItems"
            :key="item.productId._id"
            class="wishlist-item-card"
            @click="navigateToProduct(item.productId._id)"
            role="button"
            tabindex="0"
          >
            <!-- Product image block -->
            <div class="product-image-wrapper">
              <img
                :src="item.productId.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80'"
                :alt="item.productId.name"
                class="product-image"
                loading="lazy"
              />
              <span class="product-category-tag">
                [ {{ typeof item.productId.categoryId === 'object' ? item.productId.categoryId.name : 'Uncategorized' }} ]
              </span>
              <span v-if="item.productId.stock === 0" class="out-of-stock-badge">Out of Stock</span>
            </div>

            <!-- Product Details Block -->
            <div class="product-details">
              <div class="meta-row">
                <span class="product-serial">CATALOG REF // {{ item.productId._id.substring(0, 10).toUpperCase() }}</span>
                <h3 class="product-title">
                  {{ item.productId.name }}
                </h3>
                <p class="product-description">{{ item.productId.description }}</p>
                <p class="product-price">
                  ${{ item.productId.price?.toFixed(2) }}
                </p>
              </div>
              
              <!-- Actions -->
              <div class="product-card-actions" @click.stop>
                <BaseButton variant="primary" size="sm" class="btn-cart" @click="navigateToProduct(item.productId._id)">
                  View Details
                </BaseButton>
                
                <BaseButton
                  variant="ghost"
                  size="sm"
                  :loading="removingId === item.productId._id"
                  @click="handleRemoveItem(item.productId._id)"
                  class="btn-remove"
                >
                  Release
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.wishlist-view {
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

/* Filter Bar */
.wishlist-filters {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 36px;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 420px;
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
  padding: 12px 40px 12px 48px;
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  transition: all var(--duration-base) var(--ease-out);
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(15, 61, 94, 0.08);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.clear-search-btn:hover {
  color: var(--color-primary);
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
  font-size: 0.8rem;
  font-weight: 700;
  padding: 6px 16px;
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

/* Filter Empty */
.filter-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 40px;
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  max-width: 420px;
  margin: 0 auto;
}

.filter-empty-title {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 8px 0;
}

.filter-empty-desc {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: var(--color-muted);
  margin: 0 0 20px 0;
}

/* Grid */
.wishlist-grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 32px;
}

/* Curation Card */
.wishlist-item-card {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: all var(--duration-base) var(--ease-spring);
  box-sizing: border-box;
  cursor: pointer;
}

.wishlist-item-card:hover {
  transform: translateY(-6px) scale(1.01);
  border-color: var(--color-accent);
  box-shadow: 0 20px 48px rgba(16, 16, 24, 0.08);
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 85%;
  background-color: var(--color-bg-alt);
  overflow: hidden;
  border-bottom: 2px solid var(--color-border);
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all var(--duration-slow) var(--ease-spring);
}

.wishlist-item-card:hover .product-image {
  transform: scale(1.05);
}

.product-category-tag {
  position: absolute;
  top: 16px;
  left: 16px;
  background-color: var(--color-surface);
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 4px 12px;
  border-radius: 99px;
  border: 1px solid var(--color-border);
}

.out-of-stock-badge {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background-color: var(--color-danger);
  color: white;
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 4px 12px;
  border-radius: 99px;
  text-transform: uppercase;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  flex-grow: 1;
  text-align: left;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.product-serial {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  font-weight: 600;
}

.product-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--color-primary);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.5em;
}

.product-description {
  margin: 4px 0 0 0;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--color-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  margin: 8px 0 0 0;
  font-family: var(--font-mono);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-accent);
}

.product-card-actions {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 2px solid var(--color-bg-alt);
}

.btn-cart {
  width: 100%;
}

.btn-remove {
  width: 100%;
  color: var(--color-muted) !important;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-remove:hover {
  color: var(--color-danger) !important;
  background-color: rgba(229, 72, 77, 0.06) !important;
}
</style>
