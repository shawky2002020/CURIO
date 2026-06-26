<script setup lang="ts">
import { Lock, Sparkles, Heart, Package, Star, ShieldCheck } from '@lucide/vue';
</script>

<template>
  <div class="hero-scene-wrapper">
    <!-- Brand Logo -->
    <router-link to="/" class="logo" aria-label="Curio Home">
      curio<span class="logo-dot">.</span>
    </router-link>

    <!-- Value Prop Headers -->
    <span class="brand-eyebrow">THE JOY OF DISCOVERY</span>
    <h1 class="brand-editorial-title">Unique Goods.<br>Playful Spirit.</h1>
    <p class="brand-editorial-text">
      A playful marketplace for unique goods, premium finds, and beautifully curated shopping moments. Step back into your Curio world.
    </p>

    <!-- Main Interactive E-Commerce Scene Canvas -->
    <div class="scene-canvas" aria-hidden="true">
      <!-- Ambient Playful Background Blobs -->
      <div class="scene-blob blob-orange"></div>
      <div class="scene-blob blob-yellow"></div>

      <!-- Dotted Path SVG Line (Connecting Orbiting Chips) -->
      <svg class="doodle-line" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50,150 C120,40 280,60 320,130 C340,170 280,240 180,230" stroke="var(--color-primary)" stroke-width="2.5" stroke-dasharray="6 6" stroke-linecap="round"/>
      </svg>

      <!-- 1. Editorial Product Preview Card (Main Hero) -->
      <div class="product-preview-card hero-float">
        <div class="image-wrapper">
          <img 
            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80" 
            alt="Product Preview" 
            class="product-img"
          />
          <span class="category-pill">ATELIER</span>
        </div>
        <div class="card-details">
          <div class="card-rating">
            <Star v-for="i in 5" :key="i" class="rating-star-icon" />
            <span class="rating-count">(48)</span>
          </div>
          <h3 class="card-title">Signature Chronograph</h3>
          <div class="card-footer-row">
            <span class="card-price">$249.00</span>
            <span class="card-badge">DROP 01</span>
          </div>
        </div>
      </div>

      <!-- 2. Orbiting Chip: Curated (Top Left) -->
      <div class="orbit-chip chip-curated hero-float-delay-1">
        <Sparkles class="chip-icon text-gold" />
        <span class="chip-text">Curated</span>
      </div>

      <!-- 3. Orbiting Chip: Saved Item (Bottom Right) -->
      <div class="orbit-chip chip-saved hero-float-delay-2">
        <Heart class="chip-icon text-coral" />
        <span class="chip-text">Saved</span>
      </div>

      <!-- 4. Orbiting Chip: In Stock (Top Right) -->
      <div class="orbit-chip chip-stock hero-float-delay-1">
        <Package class="chip-icon text-navy" />
        <span class="chip-text">In Stock</span>
      </div>
    </div>

    <!-- Trust Seals Row -->
    <div class="trust-badge-row">
      <div class="trust-badge-card">
        <ShieldCheck class="badge-icon text-mint" />
        <div class="badge-texts">
          <span class="badge-title">Verified Curations</span>
          <span class="badge-desc">100% Authentic Quality</span>
        </div>
      </div>
      <div class="trust-badge-card">
        <Lock class="badge-icon text-orange" />
        <div class="badge-texts">
          <span class="badge-title">Secure Registry</span>
          <span class="badge-desc">Encrypted Member Data</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-scene-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 520px;
  text-align: left;
}

/* Brand logo */
.logo {
  font-family: var(--font-heading);
  font-size: 2.8rem;
  font-weight: 700;
  color: var(--color-surface);
  text-decoration: none;
  letter-spacing: -0.04em;
  display: inline-block;
  margin-bottom: 32px;
  transition: transform var(--duration-fast) var(--ease-spring);
}

.logo:hover {
  transform: scale(1.05) rotate(-2deg);
}

.logo-dot {
  color: var(--color-accent);
}

.brand-eyebrow {
  font-family: var(--font-display);
  font-size: 0.85rem;
  letter-spacing: 0.15em;
  font-weight: 700;
  color: var(--color-accent-2);
  display: block;
}

.brand-editorial-title {
  font-family: var(--font-heading);
  font-size: 3.25rem;
  color: var(--color-surface);
  margin: 12px 0 20px;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.brand-editorial-text {
  font-size: 1.05rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 40px;
}

/* Interactive Scene Canvas */
.scene-canvas {
  position: relative;
  width: 100%;
  height: 320px;
  margin-bottom: 48px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  overflow: visible;
}

/* Ambient Blobs */
.scene-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  pointer-events: none;
  opacity: 0.25;
}

.blob-orange {
  width: 140px;
  height: 140px;
  background-color: var(--color-accent);
  top: 20px;
  left: 30px;
}

.blob-yellow {
  width: 120px;
  height: 120px;
  background-color: var(--color-accent-2);
  bottom: 40px;
  right: 50px;
}

/* Doodle connecting line */
.doodle-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.3;
}

/* Editorial Product Card */
.product-preview-card {
  position: absolute;
  width: 220px;
  background-color: var(--color-surface);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: 10px;
  box-shadow: 0 16px 36px rgba(16, 16, 24, 0.25);
  top: 45px;
  left: 140px;
  z-index: 5;
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 130px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--color-bg-alt);
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-pill {
  position: absolute;
  top: 8px;
  left: 8px;
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 700;
  background-color: var(--color-primary);
  color: var(--color-surface);
  padding: 3px 8px;
  border-radius: 99px;
}

.card-details {
  padding: 10px 4px 4px;
  text-align: left;
}

.card-rating {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 4px;
}

.rating-star-icon {
  width: 12px;
  height: 12px;
  fill: var(--color-accent-2);
  color: var(--color-accent-2);
}

.rating-count {
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  margin-left: 4px;
}

.card-title {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  color: var(--color-primary);
  margin: 4px 0 8px;
}

.card-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-price {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-accent);
}

.card-badge {
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 700;
  border: 1px solid var(--color-border);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--color-muted);
}

/* Orbiting Chips */
.orbit-chip {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-surface);
  border: 2px solid var(--color-primary);
  border-radius: 99px;
  padding: 8px 16px;
  box-shadow: 0 8px 24px rgba(16, 16, 24, 0.15);
  z-index: 6;
}

.chip-icon {
  width: 16px;
  height: 16px;
}

.text-gold {
  color: var(--color-accent-2);
  fill: var(--color-accent-2);
}

.text-coral {
  color: var(--color-accent);
  fill: var(--color-accent);
}

.text-navy {
  color: var(--color-primary);
}

.chip-text {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-primary);
}

.chip-curated {
  top: 190px;
  left: 20px;
}

.chip-saved {
  top: 220px;
  right: 20px;
}

.chip-stock {
  top: 30px;
  right: 40px;
}

/* Trust Seals Row */
.trust-badge-row {
  display: flex;
  gap: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 32px;
}

.trust-badge-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px 18px;
  border-radius: var(--radius-md);
  flex: 1;
}

.badge-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.text-mint {
  color: var(--color-accent-3);
}

.text-orange {
  color: var(--color-accent);
}

.badge-texts {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.badge-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-surface);
}

.badge-desc {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.65);
}
</style>
