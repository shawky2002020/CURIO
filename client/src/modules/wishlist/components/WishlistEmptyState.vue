<script setup lang="ts">
import BaseButton from '../../../components/ui/BaseButton.vue';

/**
 * WishlistEmptyState Component
 * A beautifully designed empty state encouraging users to explore the store catalog.
 */
</script>

<template>
  <div class="wishlist-empty motion-scale-in">
    <!-- Heart Icon Graphics (Playful Bouncing Heart) -->
    <div class="empty-icon-wrapper" aria-hidden="true">
      <svg
        class="empty-heart-icon bouncy-heart"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </div>

    <!-- Explanation Copy -->
    <h3 class="empty-title">Archive Vacant</h3>
    <p class="empty-description">
      Your curation archive is currently empty. Save objects you love here to easily track, acquire, or share them later.
    </p>

    <!-- Exploration CTA -->
    <router-link to="/" class="explore-link">
      <BaseButton variant="primary" class="explore-btn">
        Browse Collection
      </BaseButton>
    </router-link>
  </div>
</template>

<style scoped>
.wishlist-empty {
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
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: rgba(255, 107, 53, 0.08);
  color: var(--color-accent);
  margin-bottom: 32px;
}

.empty-heart-icon {
  width: 38px;
  height: 38px;
}

.empty-title {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 12px 0;
  letter-spacing: -0.01em;
}

.empty-description {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0 0 32px 0;
  max-width: 360px;
}

.explore-link {
  text-decoration: none;
  width: 100%;
  max-width: 220px;
}

.explore-btn {
  width: 100%;
}
</style>
