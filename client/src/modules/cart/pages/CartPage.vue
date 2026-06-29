<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../../../stores/cart.store.js';
import { cartApi, type ActivePromoInfo } from '../../../api/cart.api.js';
import BaseButton from '../../../components/ui/BaseButton.vue';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles } from '@lucide/vue';

const router = useRouter();
const cartStore = useCartStore();

const promoCode = ref('');
const applyingPromo = ref(false);
const activePromos = ref<ActivePromoInfo[]>([]);

onMounted(async () => {
  await cartStore.fetchCart();
  if (cartStore.cart?.promoCode) {
    promoCode.value = cartStore.cart.promoCode;
  }
  try {
    const res = await cartApi.fetchActivePromos();
    if (res.success && res.data) {
      activePromos.value = res.data;
    }
  } catch (err) {
    console.error('Failed to load active promos:', err);
  }
});

const isCartEmpty = computed(() => {
  return !cartStore.cart || cartStore.cart.items.length === 0;
});

const handleQuantityChange = async (itemId: string, currentQty: number, delta: number) => {
  const newQty = currentQty + delta;
  if (newQty < 1) return;
  try {
    await cartStore.updateQuantity(itemId, newQty);
  } catch (err) {
    // Error is toasted
  }
};

const handleRemoveItem = async (itemId: string) => {
  try {
    await cartStore.removeFromCart(itemId);
  } catch (err) {
    // Error is toasted
  }
};

const handleClearCart = async () => {
  if (confirm('Are you sure you want to clear your shopping cart registry?')) {
    try {
      await cartStore.clearCart();
    } catch (err) {
      // Error is toasted
    }
  }
};

const handleApplyPromo = async () => {
  if (!promoCode.value.trim()) return;
  applyingPromo.value = true;
  try {
    await cartStore.applyPromo(promoCode.value);
  } catch (err) {
    // Error is toasted
  } finally {
    applyingPromo.value = false;
  }
};

const handleApplySuggestedPromo = async (code: string) => {
  if (cartStore.cart?.promoCode) return;
  promoCode.value = code;
  await handleApplyPromo();
};

const handleRemovePromo = async () => {
  applyingPromo.value = true;
  try {
    await cartStore.removePromo();
    promoCode.value = '';
  } catch (err) {
    // Error is toasted
  } finally {
    applyingPromo.value = false;
  }
};

const getProductImage = (item: any) => {
  if (item.productId?.images && item.productId.images.length > 0) {
    return item.productId.images[0];
  }
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80';
};
</script>

<template>
  <div class="cart-view">
    <header class="page-header">
      <span class="page-eyebrow">YOUR ATELIER BAG</span>
      <h1 class="page-title">Shopping Cart</h1>
    </header>

    <!-- Loading State -->
    <div v-if="cartStore.loading && !cartStore.cart" class="cart-loading">
      <div class="skeleton-list motion-shimmer"></div>
      <div class="skeleton-summary motion-shimmer"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="isCartEmpty" class="cart-empty motion-scale-in">
      <div class="empty-icon-wrapper">
        <ShoppingBag class="empty-bag-icon" />
      </div>
      <h3 class="empty-title">Your cart is empty</h3>
      <p class="empty-description">
        You haven't registered any curated objects yet. Explore our catalog to find unique items.
      </p>
      <BaseButton variant="primary" @click="router.push({ name: 'home' })">
        Explore Collection
      </BaseButton>
    </div>

    <!-- Cart Content -->
    <div v-else class="cart-grid">
      <!-- Items List -->
      <div class="cart-items-section">
        <div class="cart-items-header">
          <span>CURATED ITEMS ({{ cartStore.cartCount }})</span>
          <button class="btn-clear-all" @click="handleClearCart" :disabled="cartStore.loading">
            Clear Registry
          </button>
        </div>

        <ul class="cart-items-list">
          <li v-for="item in cartStore.cart?.items" :key="item._id" class="cart-item-card">
            <img 
              :src="getProductImage(item)" 
              :alt="item.productId?.name" 
              class="item-img"
              @click="router.push({ name: 'product-detail', params: { id: item.productId?._id } })"
            />
            
            <div class="item-details">
              <h3 
                class="item-name"
                @click="router.push({ name: 'product-detail', params: { id: item.productId?._id } })"
              >
                {{ item.productId?.name }}
              </h3>
              <span class="item-price">${{ item.productId?.price.toFixed(2) }}</span>
            </div>

            <!-- Qty Adjustment -->
            <div class="qty-adjuster">
              <button 
                class="qty-adjust-btn" 
                :disabled="item.quantity <= 1 || cartStore.loading"
                @click="handleQuantityChange(item._id, item.quantity, -1)"
                aria-label="Decrease quantity"
              >
                <Minus class="qty-icon" />
              </button>
              <span class="qty-text">{{ item.quantity }}</span>
              <button 
                class="qty-adjust-btn" 
                :disabled="item.quantity >= (item.productId?.stock || 0) || cartStore.loading"
                @click="handleQuantityChange(item._id, item.quantity, 1)"
                aria-label="Increase quantity"
              >
                <Plus class="qty-icon" />
              </button>
            </div>

            <!-- Total Price -->
            <div class="item-total-col">
              <span class="item-total-price">
                ${{ ((item.productId?.price || 0) * item.quantity).toFixed(2) }}
              </span>
            </div>

            <!-- Remove Button -->
            <button 
              class="btn-remove-item" 
              @click="handleRemoveItem(item._id)" 
              :disabled="cartStore.loading"
              aria-label="Remove item"
            >
              <Trash2 class="remove-icon" />
            </button>
          </li>
        </ul>
      </div>

      <!-- Order Summary -->
      <div class="cart-summary-section">
        <div class="summary-card">
          <h3 class="summary-title">Registry Summary</h3>

          <!-- Promo Code Form -->
          <div class="promo-container">
            <label for="promo-input" class="promo-label">Atelier Promo Code</label>
            <div class="promo-form">
              <input
                id="promo-input"
                v-model="promoCode"
                type="text"
                placeholder="Enter code (e.g. SAVE10)"
                class="promo-input"
                :disabled="cartStore.loading || applyingPromo || !!cartStore.cart?.promoCode"
              />
              <button
                v-if="cartStore.cart?.promoCode"
                type="button"
                class="btn-promo btn-promo--remove"
                :disabled="cartStore.loading || applyingPromo"
                @click="handleRemovePromo"
              >
                Remove
              </button>
              <button
                v-else
                type="button"
                class="btn-promo btn-promo--apply"
                :disabled="cartStore.loading || applyingPromo || !promoCode.trim()"
                @click="handleApplyPromo"
              >
                Apply
              </button>
            </div>
            <!-- Feedback -->
            <div v-if="cartStore.cart?.promoCode" class="promo-feedback promo-feedback--success">
              <Sparkles class="promo-fb-icon" /> Applied promo code: {{ cartStore.cart.promoCode }}
            </div>

            <!-- Suggested Offers -->
            <div v-if="activePromos.length > 0 && !cartStore.cart?.promoCode" class="promo-suggestions">
              <span class="suggestions-label">Available Offers:</span>
              <div class="suggestions-list">
                <button
                  v-for="promo in activePromos"
                  :key="promo.code"
                  type="button"
                  class="promo-badge-btn"
                  @click="handleApplySuggestedPromo(promo.code)"
                  title="Click to apply"
                >
                  <span class="badge-code">{{ promo.code }}</span>
                  <span class="badge-discount">
                    ({{ promo.discountType === 'percentage' ? `${promo.discountValue}%` : `$${promo.discountValue}` }} Off)
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Price breakdown -->
          <div class="summary-breakdown">
            <div class="summary-row">
              <span class="summary-row-label">Subtotal</span>
              <span class="summary-row-val">${{ cartStore.totals.subtotal.toFixed(2) }}</span>
            </div>
            
            <div v-if="cartStore.totals.discount > 0" class="summary-row summary-row--discount">
              <span class="summary-row-label">Atelier Discount</span>
              <span class="summary-row-val">-${{ cartStore.totals.discount.toFixed(2) }}</span>
            </div>

            <div class="summary-row">
              <span class="summary-row-label">Shipping</span>
              <span class="summary-row-val">
                {{ cartStore.totals.shipping === 0 ? 'Free' : `$${cartStore.totals.shipping.toFixed(2)}` }}
              </span>
            </div>

            <div class="summary-row">
              <span class="summary-row-label">Registry Tax ({{ cartStore.totals.taxRate }}%)</span>
              <span class="summary-row-val">${{ cartStore.totals.tax.toFixed(2) }}</span>
            </div>

            <div class="summary-row summary-row--total">
              <span class="summary-row-label">Total Registry Value</span>
              <span class="summary-row-val">${{ cartStore.totals.total.toFixed(2) }}</span>
            </div>
          </div>

          <BaseButton 
            variant="primary" 
            class="btn-checkout-action" 
            :disabled="cartStore.loading"
            @click="router.push({ name: 'checkout' })"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight class="btn-arrow-icon" />
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-view {
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
  margin: 0;
  letter-spacing: -0.02em;
}

/* Loading */
.cart-loading {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
}

.skeleton-list {
  height: 400px;
  background-color: var(--color-bg-alt);
  border-radius: var(--radius-lg);
}

.skeleton-summary {
  height: 300px;
  background-color: var(--color-bg-alt);
  border-radius: var(--radius-lg);
}

/* Empty */
.cart-empty {
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
  margin: 40px auto;
  box-sizing: border-box;
}

.empty-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: rgba(255, 107, 53, 0.08);
  color: var(--color-accent);
  margin-bottom: 24px;
}

.empty-bag-icon {
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

/* Grid Layout */
.cart-grid {
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 48px;
  align-items: start;
}

@media (max-width: 992px) {
  .cart-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

/* Cart Items Section */
.cart-items-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cart-items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 12px;
}

.btn-clear-all {
  background: none;
  border: none;
  color: var(--color-muted);
  font-family: var(--font-display);
  font-weight: 700;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out);
}

.btn-clear-all:hover:not(:disabled) {
  color: var(--color-danger);
}

.cart-items-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cart-item-card {
  display: flex;
  align-items: center;
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  gap: 20px;
  transition: border-color var(--duration-base) var(--ease-out);
}

.cart-item-card:hover {
  border-color: var(--color-accent);
}

.item-img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  cursor: pointer;
  background-color: var(--color-bg-alt);
}

.item-details {
  flex-grow: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
  cursor: pointer;
}

.item-name:hover {
  color: var(--color-accent);
}

.item-price {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-muted);
}

/* Qty adjuster */
.qty-adjuster {
  display: flex;
  align-items: center;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-bg-alt);
}

.qty-adjust-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.qty-adjust-btn:hover:not(:disabled) {
  background-color: var(--color-surface);
}

.qty-adjust-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-icon {
  width: 14px;
  height: 14px;
}

.qty-text {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 700;
  min-width: 30px;
  text-align: center;
}

.item-total-col {
  min-width: 90px;
  text-align: right;
}

.item-total-price {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary);
}

.btn-remove-item {
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) var(--ease-out);
}

.btn-remove-item:hover:not(:disabled) {
  color: var(--color-danger);
  background-color: rgba(229, 72, 77, 0.08);
}

.remove-icon {
  width: 18px;
  height: 18px;
}

/* Summary Card */
.cart-summary-section {
  position: sticky;
  top: 100px;
}

.summary-card {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: var(--shadow-card);
}

.summary-title {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
  text-align: left;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 16px;
}

/* Promo */
.promo-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.promo-label {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--color-primary);
}

.promo-form {
  display: flex;
  gap: 8px;
}

.promo-input {
  flex-grow: 1;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: var(--color-primary);
  background-color: var(--color-bg-alt);
  min-width: 0;
  text-transform: uppercase;
}

.promo-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.promo-input:disabled {
  opacity: 0.7;
}

.btn-promo {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  border: 2px solid transparent;
}

.btn-promo--apply {
  background-color: var(--color-primary);
  color: var(--color-surface);
}

.btn-promo--apply:hover:not(:disabled) {
  background-color: var(--color-accent);
}

.btn-promo--apply:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-promo--remove {
  background-color: transparent;
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.btn-promo--remove:hover:not(:disabled) {
  background-color: rgba(229, 72, 77, 0.08);
}

.promo-feedback {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.promo-feedback--success {
  color: var(--color-success);
}

.promo-fb-icon {
  width: 14px;
  height: 14px;
}

.promo-suggestions {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.suggestions-label {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.promo-badge-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--color-bg-alt);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.promo-badge-btn:hover {
  border-color: var(--color-accent);
  background-color: var(--color-surface);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.badge-code {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 805;
  color: var(--color-accent);
}

.badge-discount {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text);
}

/* Price Breakdown */
.summary-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--color-muted);
}

.summary-row-val {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-primary);
}

.summary-row--discount {
  color: var(--color-success);
}

.summary-row--discount .summary-row-val {
  color: var(--color-success);
}

.summary-row--total {
  border-top: 2px dashed var(--color-border);
  padding-top: 16px;
  margin-top: 4px;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-primary);
}

.summary-row--total .summary-row-val {
  font-size: 1.25rem;
  color: var(--color-accent);
}

.btn-checkout-action {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 16px !important;
  font-size: 1rem !important;
}

.btn-arrow-icon {
  width: 16px;
  height: 16px;
}

@media (max-width: 576px) {
  .cart-item-card {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px;
  }
  
  .item-img {
    width: 60px;
    height: 60px;
  }

  .item-total-col {
    order: 2;
    flex-grow: 1;
    text-align: right;
  }

  .qty-adjuster {
    order: 1;
  }

  .btn-remove-item {
    order: 3;
  }
}
</style>
