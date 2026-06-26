<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWishlistStore } from '../../../stores/wishlist.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';
import WishlistButton from '../../wishlist/components/WishlistButton.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import { Search, Sparkles } from '@lucide/vue';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

const wishlistStore = useWishlistStore();
const authStore = useAuthStore();

// Curated premium product list matching CURIO aesthetic
const products = ref<Product[]>([
  {
    id: '60d5ecb863a6c22c5c8b4999',
    name: 'Signature Chronograph Leather Watch',
    price: 249.00,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    category: 'Chronometry',
    description: 'Precision engineered dial paired with hand-stitched Horween leather strap. Designed for enduring elegance.',
  },
  {
    id: '60d5ecb863a6c22c5c8b4998',
    name: 'Premium Leather Overnight Duffle',
    price: 189.00,
    image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=600&q=80',
    category: 'Leather Goods',
    description: 'Full-grain vegetable-tanned leather with a spacious main compartment, robust solid brass hardware, and dual zippers.',
  },
  {
    id: '60d5ecb863a6c22c5c8b4997',
    name: 'Minimalist Brass Desk Organizer',
    price: 85.00,
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
    category: 'Atelier',
    description: 'Heavy solid brass block machined to hold your instruments, letters, and mobile device. Brushed tactile finish.',
  },
  {
    id: '60d5ecb863a6c22c5c8b4996',
    name: 'Hand-Blown Borosilicate Glass Carafe',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=600&q=80',
    category: 'Dining',
    description: 'Thermal-resistant borosilicate glass carafe with a solid walnut spherical stopper. Made by master glassblowers.',
  },
  {
    id: '60d5ecb863a6c22c5c8b4995',
    name: 'Merino Wool Knit Throw Blanket',
    price: 145.00,
    image: 'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=600&q=80',
    category: 'Home Goods',
    description: 'Ultra-soft extrafine Merino wool throw featuring a heavy waffle knit structure and organic charcoal hues.',
  },
  {
    id: '60d5ecb863a6c22c5c8b4994',
    name: 'Matte Black Fountain Pen',
    price: 110.00,
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
    category: 'Writing',
    description: 'Ergonomic aluminum barrel in deep matte black, fitted with a custom 14k gold-plated fine nib for cursive flow.',
  },
]);

// Filtering States
const searchQuery = ref('');
const activeCategory = ref('All');
const categories = ['All', 'Chronometry', 'Leather Goods', 'Atelier', 'Dining', 'Home Goods', 'Writing'];

// Filter products dynamically based on search and category tab
const filteredProducts = computed(() => {
  return products.value.filter(product => {
    const matchesCategory = activeCategory.value === 'All' || product.category === activeCategory.value;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesCategory && matchesSearch;
  });
});

// Fetch user's wishlist state on mount if logged in
onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await wishlistStore.fetchWishlist();
    } catch (err) {
      console.error('Failed to pre-fetch wishlist for catalog synchronization', err);
    }
  }
});
</script>

<template>
  <div class="catalog-view">
    <!-- Editorial Header Section -->
    <header class="page-header">
      <span class="page-eyebrow">CURIO EXQUISITE REGISTRY</span>
      <h1 class="page-title">Curated Objects</h1>
      <p class="page-subtitle">Discover a select collection of premium accessories, unique designs, and atelier items.</p>
    </header>

    <!-- Search and Category Filter Toolbar -->
    <section class="toolbar-section" aria-label="Filters and Search">
      <!-- Search Input Box -->
      <div class="search-box">
        <Search class="search-icon" aria-hidden="true" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search collections, materials, names..."
          class="search-input"
          aria-label="Search catalog"
        />
      </div>

      <!-- Category Filter Tabs (Tactile Capsules) -->
      <nav class="category-tabs" aria-label="Catalog category filter">
        <button
          v-for="category in categories"
          :key="category"
          :class="['category-tab', { 'category-tab--active': activeCategory === category }]"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </nav>
    </section>

    <!-- Product Grid Content -->
    <section class="catalog-grid-section" aria-label="Curated Collection Grid">
      <!-- Empty State -->
      <div v-if="filteredProducts.length === 0" class="catalog-empty motion-scale-in">
        <div class="empty-icon-wrapper" aria-hidden="true">
          <Sparkles class="empty-spark-icon" />
        </div>
        <h3 class="empty-title">No matching objects found</h3>
        <p class="empty-description">
          We could not find any items matching your query. Try resetting your category filter or modifying your search text.
        </p>
        <BaseButton variant="secondary" @click="searchQuery = ''; activeCategory = 'All'">
          Reset Filters
        </BaseButton>
      </div>

      <!-- Active Grid Layout -->
      <div v-else class="catalog-grid">
        <article
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-card motion-scale-in"
        >
          <!-- Product Image & Overlay tag -->
          <div class="product-image-wrapper">
            <img
              :src="product.image"
              :alt="product.name"
              class="product-image"
              loading="lazy"
            />
            <span class="product-category-tag">
              [ {{ product.category }} ]
            </span>
            
            <!-- Absolute Positioned Wishlist Button -->
            <div class="wishlist-btn-overlay">
              <WishlistButton :productId="product.id" />
            </div>
          </div>

          <!-- Product Details and CTA Actions -->
          <div class="product-details">
            <div class="meta-row">
              <span class="product-serial">OBJECT REF // {{ product.id.substring(0, 8).toUpperCase() }}</span>
              <h3 class="product-title">{{ product.name }}</h3>
              <p class="product-description">{{ product.description }}</p>
            </div>
            
            <div class="card-footer-row">
              <span class="product-price">${{ product.price.toFixed(2) }}</span>
              <BaseButton variant="primary" size="sm" class="btn-acquire">
                Acquire
              </BaseButton>
            </div>
          </div>
        </article>
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

/* Toolbar Style */
.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 48px;
  text-align: left;
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
  color: var(--color-text-h);
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
  border-radius: var(--radius-pill);
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

/* Grid Layout */
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}

.product-card {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: all var(--duration-base) var(--ease-spring);
  box-sizing: border-box;
}

.product-card:hover {
  transform: translateY(-6px) scale(1.01);
  border-color: var(--color-accent);
  box-shadow: 0 20px 48px rgba(16, 16, 24, 0.08);
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 80%; /* Widescreen aspect ratio */
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

.product-card:hover .product-image {
  transform: scale(1.04);
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
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  z-index: 2;
}

.wishlist-btn-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
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
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.25;
}

.product-description {
  margin: 8px 0 0 0;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: var(--color-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 4.5em; /* Ensure uniform height for card alignment */
}

.card-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 16px;
  border-top: 2px solid var(--color-bg-alt);
}

.product-price {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-accent);
}

.btn-acquire {
  min-width: 100px;
}

/* Empty State */
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
