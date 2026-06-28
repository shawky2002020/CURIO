<script setup lang="ts">
import { computed } from 'vue';
import { useWishlistStore } from '../../../stores/wishlist.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';
import { useToastStore } from '../../../stores/toast.store.js';
import { useRouter } from 'vue-router';

/**
 * WishlistButton Component
 * A highly reusable wishlist toggle button suitable for product detail pages or catalog grids.
 */
const props = defineProps<{
  productId: string;
}>();

const wishlistStore = useWishlistStore();
const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();

// Compute whether the item is in the wishlist
const isWishlisted = computed(() => {
  if (!wishlistStore.wishlist) return false;
  return wishlistStore.wishlist.items.some((item: any) => {
    const id = typeof item.productId === 'object' ? item.productId._id : item.productId;
    return id === props.productId;
  });
});

const handleToggle = async (event: Event) => {
  event.stopPropagation();
  event.preventDefault();

  if (!authStore.isAuthenticated) {
    toastStore.info('Please sign in to save items.');
    // Redirect to login page if unauthenticated
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
    return;
  }

  try {
    if (isWishlisted.value) {
      await wishlistStore.removeFromWishlist(props.productId);
      toastStore.success('Item released from your curation.');
    } else {
      await wishlistStore.addToWishlist(props.productId);
      toastStore.success('Item archived in your curation.');
    }
  } catch (err) {
    toastStore.error('Failed to update curation.');
    console.error('Failed to toggle wishlist state', err);
  }
};
</script>

<template>
  <button
    type="button"
    :class="['wishlist-action-btn', { 'is-active': isWishlisted }]"
    @click="handleToggle"
    :aria-label="isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'"
  >
    <!-- Heart Icon SVG -->
    <svg
      class="heart-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  </button>
</template>

<style scoped>
.wishlist-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-muted);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.wishlist-action-btn:hover {
  transform: scale(1.05);
  border-color: var(--color-error);
  color: var(--color-error);
}

.wishlist-action-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.heart-icon {
  width: 18px;
  height: 18px;
  transition: fill 0.2s, stroke 0.2s;
}

/* Active Wishlisted State styles */
.is-active {
  background-color: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.2);
  color: var(--color-error);
}

.is-active .heart-icon {
  fill: var(--color-error);
  stroke: var(--color-error);
}
</style>
