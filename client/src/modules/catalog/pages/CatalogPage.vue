<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '../../../stores/product.store.js';
import { useCategoryStore } from '../../../stores/category.store.js';
import { useWishlistStore } from '../../../stores/wishlist.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';
import { http } from '../../../api/http.js';
import ProductCard from '../components/ProductCard.vue';
import ProductFilterBar from '../components/ProductFilterBar.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import { Sparkles, ChevronLeft, ChevronRight } from '@lucide/vue';

const router = useRouter();
const productStore = useProductStore();
const categoryStore = useCategoryStore();
const wishlistStore = useWishlistStore();
const authStore = useAuthStore();

const filterBarRef = ref<InstanceType<typeof ProductFilterBar> | null>(null);

interface ActiveBanner {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
}

const activeBanners = ref<ActiveBanner[]>([]);
const currentSlide = ref(0);
let slideInterval: any = null;

const startSlideShow = () => {
  stopSlideShow();
  if (activeBanners.value.length > 1) {
    slideInterval = setInterval(() => {
      nextSlide();
    }, 6000);
  }
};

const stopSlideShow = () => {
  if (slideInterval) clearInterval(slideInterval);
};

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % activeBanners.value.length;
};

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + activeBanners.value.length) % activeBanners.value.length;
};

const setSlide = (idx: number) => {
  currentSlide.value = idx;
  startSlideShow();
};

const handleBannerClick = (banner: ActiveBanner) => {
  if (banner.linkUrl) {
    if (banner.linkUrl.startsWith('http')) {
      window.open(banner.linkUrl, '_blank');
    } else {
      router.push(banner.linkUrl);
    }
  }
};

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories(),
    productStore.fetchProducts(),
    authStore.isAuthenticated ? wishlistStore.fetchWishlist().catch(() => {}) : Promise.resolve(),
  ]);

  try {
    const bannerRes = await http.get('/banners/active');
    if (bannerRes.data?.success && bannerRes.data?.data) {
      activeBanners.value = bannerRes.data.data;
      if (activeBanners.value.length > 0) {
        startSlideShow();
      }
    }
  } catch (err) {
    console.error('Failed to load active banners:', err);
  }
});

onUnmounted(() => {
  stopSlideShow();
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

const selectCategoryFilter = (categoryId: string) => {
  filterBarRef.value?.setCategoryIdExternal(categoryId);
};

const getCategoryFallbackImage = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('stone') || n.includes('clay')) {
    return 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=400';
  }
  if (n.includes('access')) {
    return 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=400';
  }
  return 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=400';
};
</script>

<template>
  <div class="catalog-view">
    <!-- Editorial Header (Only show if no banners, to avoid clutter) -->
    <header v-if="activeBanners.length === 0" class="page-header">
      <span class="page-eyebrow">CURIO EXQUISITE REGISTRY</span>
      <h1 class="page-title">Curated Objects</h1>
      <p class="page-subtitle">Discover a select collection of premium accessories, unique designs, and atelier items.</p>
    </header>

    <!-- Stunning Hero Banner Carousel -->
    <section v-else class="hero-carousel-section">
      <div class="carousel-container">
        <div
          v-for="(banner, index) in activeBanners"
          :key="banner._id"
          :class="['carousel-slide', { active: index === currentSlide }]"
          @click="handleBannerClick(banner)"
        >
          <!-- Background Image -->
          <div class="slide-bg" :style="{ backgroundImage: `url(${banner.imageUrl})` }"></div>
          <div class="slide-overlay"></div>

          <!-- Glassmorphic content box -->
          <div class="slide-content-wrap">
            <div class="slide-glass-box">
              <span class="slide-eyebrow">CURIO FEATURED CURATION</span>
              <h2 class="slide-title">{{ banner.title }}</h2>
              <p v-if="banner.subtitle" class="slide-subtitle">{{ banner.subtitle }}</p>
              <div v-if="banner.linkUrl" class="slide-cta-btn">
                <span>Explore Collection</span>
                <ChevronRight class="cta-arrow-icon" />
              </div>
            </div>
          </div>
        </div>

        <!-- Carousel navigation arrows -->
        <button v-if="activeBanners.length > 1" class="carousel-nav-btn prev-btn" @click.stop="prevSlide">
          <ChevronLeft class="nav-arrow-icon" />
        </button>
        <button v-if="activeBanners.length > 1" class="carousel-nav-btn next-btn" @click.stop="nextSlide">
          <ChevronRight class="nav-arrow-icon" />
        </button>

        <!-- Pagination indicators -->
        <div v-if="activeBanners.length > 1" class="carousel-indicators">
          <button
            v-for="(_, index) in activeBanners"
            :key="index"
            :class="['indicator-dot', { active: index === currentSlide }]"
            @click.stop="setSlide(index)"
          ></button>
        </div>
      </div>
    </section>

    <!-- Curated Categories Row -->
    <section v-if="categoryStore.categories.length > 0" class="curated-categories-section">
      <div class="section-header-wrap">
        <h2 class="section-title">Shop by Curation</h2>
        <p class="section-subtitle">Select a visual collection to begin exploring modernist designs.</p>
      </div>
      <div class="categories-grid-row">
        <div
          v-for="cat in categoryStore.categories"
          :key="cat._id"
          class="category-curation-card"
          @click="selectCategoryFilter(cat._id)"
        >
          <div
            class="cat-card-bg"
            :style="{ backgroundImage: `url(${cat.imageUrl || getCategoryFallbackImage(cat.name)})` }"
          ></div>
          <div class="cat-card-overlay"></div>
          <div class="cat-card-content">
            <h3 class="cat-card-name">{{ cat.name }}</h3>
            <span class="cat-card-action">Explore Curation</span>
          </div>
        </div>
      </div>
    </section>

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

/* Hero Carousel Styling */
.hero-carousel-section {
  width: 100%;
  margin-bottom: 40px;
}

.carousel-container {
  position: relative;
  width: 100%;
  height: 480px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  background-color: #0b0f19;
}

.carousel-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.8s ease-in-out;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.carousel-slide.active {
  opacity: 1;
  pointer-events: auto;
}

.slide-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transform: scale(1.03);
  transition: transform 6s ease-out;
}

.carousel-slide.active .slide-bg {
  transform: scale(1);
}

.slide-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, rgba(11, 15, 25, 0.75) 0%, rgba(11, 15, 25, 0.25) 50%, rgba(11, 15, 25, 0.1) 100%);
}

.slide-content-wrap {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 48px;
  display: flex;
  justify-content: flex-start;
  box-sizing: border-box;
}

.slide-glass-box {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--radius-lg);
  padding: 40px;
  max-width: 520px;
  text-align: left;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.slide-eyebrow {
  font-family: var(--font-display);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: 12px;
  display: block;
}

.slide-title {
  font-family: var(--font-heading);
  font-size: 2.6rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 16px 0;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.slide-subtitle {
  font-family: var(--font-sans);
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  margin: 0 0 28px 0;
}

.slide-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: #ffffff;
  color: #0b0f19;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 700;
  transition: all var(--duration-fast);
}

.slide-cta-btn:hover {
  background-color: var(--color-accent);
  color: #ffffff;
  transform: translateX(3px);
}

.cta-arrow-icon {
  width: 16px;
  height: 16px;
}

/* Nav arrows */
.carousel-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(11, 15, 25, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  transition: all 0.25s;
}

.carousel-nav-btn:hover {
  background: rgba(11, 15, 25, 0.65);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}

.prev-btn {
  left: 24px;
}

.next-btn {
  right: 24px;
}

.nav-arrow-icon {
  width: 20px;
  height: 20px;
}

/* Dot indicators */
.carousel-indicators {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 20;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s;
}

.indicator-dot.active {
  background: #ffffff;
  width: 24px;
  border-radius: 4px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .carousel-container {
    height: 380px;
  }
  
  .slide-content-wrap {
    padding: 0 24px;
  }
  
  .slide-glass-box {
    padding: 24px;
    max-width: 85%;
  }

  .slide-title {
    font-size: 1.8rem;
  }

  .slide-subtitle {
    font-size: 0.9rem;
    margin-bottom: 18px;
  }
}

/* Curated Categories Section */
.curated-categories-section {
  width: 100%;
  margin-top: 24px;
  margin-bottom: 56px;
  text-align: left;
}

.section-header-wrap {
  margin-bottom: 24px;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--color-muted);
  margin: 0;
}

.categories-grid-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.category-curation-card {
  position: relative;
  height: 220px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: flex-end;
  padding: 24px;
  box-sizing: border-box;
}

.cat-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transition: transform var(--duration-slow) var(--ease-out);
}

.category-curation-card:hover .cat-card-bg {
  transform: scale(1.06);
}

.cat-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, rgba(11, 15, 25, 0.85) 0%, rgba(11, 15, 25, 0.2) 70%, rgba(11, 15, 25, 0.05) 100%);
}

.cat-card-content {
  position: relative;
  z-index: 5;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.cat-card-name {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 750;
  color: #ffffff;
  margin: 0;
}

.cat-card-action {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.9;
  transition: opacity var(--duration-fast);
}

.category-curation-card:hover .cat-card-action {
  opacity: 1;
  text-decoration: underline;
}
</style>
