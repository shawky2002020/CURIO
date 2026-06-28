<script setup lang="ts">
import { computed } from 'vue';
import { Star } from '@lucide/vue';

const props = withDefaults(
  defineProps<{
    rating: number;
    maxStars?: number;
    interactive?: boolean;
    size?: 'sm' | 'md';
  }>(),
  {
    maxStars: 5,
    interactive: false,
    size: 'md',
  }
);

const emit = defineEmits<{
  (e: 'rate', value: number): void;
}>();

const stars = computed(() =>
  Array.from({ length: props.maxStars }, (_, i) => i + 1)
);

const handleRate = (value: number) => {
  if (props.interactive) emit('rate', value);
};
</script>

<template>
  <div :class="['star-rating', `star-rating--${size}`]" role="img" :aria-label="`Rating: ${rating} out of ${maxStars} stars`">
    <button
      v-for="star in stars"
      :key="star"
      :class="['star-btn', { 'star-btn--filled': star <= Math.round(rating), 'star-btn--interactive': interactive }]"
      :disabled="!interactive"
      @click="handleRate(star)"
      :aria-label="`Rate ${star} star${star > 1 ? 's' : ''}`"
    >
      <Star :class="['star-icon', { 'star-icon--filled': star <= Math.round(rating) }]" />
    </button>
    <span v-if="size === 'md'" class="rating-label">{{ rating.toFixed(1) }}</span>
  </div>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.star-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: default;
  display: flex;
  align-items: center;
  transition: transform var(--duration-fast) var(--ease-spring);
}

.star-btn--interactive {
  cursor: pointer;
}

.star-btn--interactive:hover {
  transform: scale(1.25);
}

.star-icon {
  width: 16px;
  height: 16px;
  color: var(--color-border);
  transition: color var(--duration-fast) var(--ease-out);
  stroke-width: 2;
}

.star-rating--sm .star-icon {
  width: 13px;
  height: 13px;
}

.star-icon--filled {
  color: var(--color-accent-2);
  fill: var(--color-accent-2);
}

.rating-label {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-muted);
  margin-left: 6px;
}
</style>
