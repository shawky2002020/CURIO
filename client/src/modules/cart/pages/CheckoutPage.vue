<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '../../../stores/cart.store.js';
import { useAuthStore } from '../../../stores/auth.store.js';
import { useToastStore } from '../../../stores/toast.store.js';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseInput from '../../../components/ui/BaseInput.vue';
import { ArrowLeft, CreditCard, Lock, Sparkles } from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const form = ref({
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  postalCode: '',
});

const errors = ref<Record<string, string>>({});
const submitError = ref<string | null>(null);

onMounted(async () => {
  if (route.query.cancelled === 'true') {
    toastStore.warning('Payment was cancelled. You can complete checkout when ready.');
  }

  // Ensure cart is loaded
  if (!cartStore.cart) {
    await cartStore.fetchCart();
  }

  // Redirect if cart is empty
  if (!cartStore.cart || cartStore.cart.items.length === 0) {
    toastStore.warning('Your shopping cart is empty.');
    router.push({ name: 'home' });
    return;
  }

  // Prefill authenticated user info
  if (authStore.isAuthenticated && authStore.user) {
    form.value.fullName = authStore.user.fullName || '';
    form.value.email = authStore.user.email || '';
    form.value.phone = authStore.user.phone || '';
  }
});

const validateForm = () => {
  const errs: Record<string, string> = {};
  errors.value = {};
  submitError.value = null;

  if (!form.value.fullName.trim()) errs.fullName = 'Full name is required.';
  if (!form.value.email.trim()) {
    errs.email = 'Email address is required.';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.value.email)) {
      errs.email = 'Please enter a valid email address.';
    }
  }
  if (!form.value.phone.trim()) errs.phone = 'Phone number is required.';
  if (!form.value.address.trim()) errs.address = 'Street address is required.';
  if (!form.value.city.trim()) errs.city = 'City is required.';
  if (!form.value.country.trim()) errs.country = 'Country is required.';
  if (!form.value.postalCode.trim()) errs.postalCode = 'Postal code is required.';

  errors.value = errs;
  return Object.keys(errs).length === 0;
};

const handlePlaceOrder = async () => {
  if (!validateForm()) {
    toastStore.error('Please correct the validation errors before proceeding.');
    return;
  }

  try {
    const result = await cartStore.checkout({
      fullName: form.value.fullName.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim(),
      address: form.value.address.trim(),
      city: form.value.city.trim(),
      country: form.value.country.trim(),
      postalCode: form.value.postalCode.trim(),
    });

    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    } else {
      router.push({ name: 'order-success', params: { id: result.order._id } });
    }
  } catch (err: any) {
    if (err.response?.status === 400 && err.response?.data?.errors) {
      // Backend validation errors mapping
      errors.value = err.response.data.errors;
      submitError.value = err.response.data.message || 'Validation failed on the server.';
    } else {
      submitError.value = err.response?.data?.message || 'An error occurred while placing the order.';
    }
  }
};
</script>

<template>
  <div class="checkout-view">
    <!-- Back to Cart -->
    <button class="back-btn" @click="router.push({ name: 'cart' })">
      <ArrowLeft class="back-icon" /> Return to Cart
    </button>

    <header class="page-header">
      <span class="page-eyebrow">SECURE CHECKOUT</span>
      <h1 class="page-title">Delivery Details</h1>
    </header>

    <div class="checkout-grid">
      <!-- Checkout Form -->
      <div class="checkout-form-section">
        <form @submit.prevent="handlePlaceOrder" class="checkout-form-card">
          <h2 class="section-title">Shipping Address</h2>
          
          <div v-if="submitError" class="submit-error-banner">
            {{ submitError }}
          </div>

          <div class="form-grid">
            <div class="form-col-full">
              <BaseInput
                id="fullName"
                label="Full Name"
                v-model="form.fullName"
                placeholder="e.g. John Doe"
                :error="errors.fullName"
                required
                :disabled="cartStore.loading"
              />
            </div>

            <div class="form-col-half">
              <BaseInput
                id="email"
                label="Email Address"
                v-model="form.email"
                type="email"
                placeholder="e.g. john@example.com"
                :error="errors.email"
                required
                :disabled="cartStore.loading"
              />
            </div>

            <div class="form-col-half">
              <BaseInput
                id="phone"
                label="Phone Number"
                v-model="form.phone"
                placeholder="e.g. +1 555-0199"
                :error="errors.phone"
                required
                :disabled="cartStore.loading"
              />
            </div>

            <div class="form-col-full">
              <BaseInput
                id="address"
                label="Street Address"
                v-model="form.address"
                placeholder="e.g. 123 Atelier Way, Apt 4B"
                :error="errors.address"
                required
                :disabled="cartStore.loading"
              />
            </div>

            <div class="form-col-half">
              <BaseInput
                id="city"
                label="City"
                v-model="form.city"
                placeholder="e.g. Paris"
                :error="errors.city"
                required
                :disabled="cartStore.loading"
              />
            </div>

            <div class="form-col-half">
              <BaseInput
                id="postalCode"
                label="Postal / Zip Code"
                v-model="form.postalCode"
                placeholder="e.g. 75001"
                :error="errors.postalCode"
                required
                :disabled="cartStore.loading"
              />
            </div>

            <div class="form-col-full">
              <BaseInput
                id="country"
                label="Country"
                v-model="form.country"
                placeholder="e.g. France"
                :error="errors.country"
                required
                :disabled="cartStore.loading"
              />
            </div>
          </div>

          <!-- Sandbox Payment Notice -->
          <div class="payment-notice-card">
            <CreditCard class="payment-icon" />
            <div class="payment-notice-details">
              <span class="payment-notice-title">Secure Payment Gateway</span>
              <span class="payment-notice-desc">
                All transactions are encrypted and processed securely via Stripe. Credit card details are never stored.
              </span>
            </div>
          </div>

          <BaseButton 
            type="submit" 
            variant="primary" 
            class="btn-place-order" 
            :disabled="cartStore.loading"
          >
            <Lock class="btn-lock-icon" />
            <span>{{ cartStore.loading ? 'Validating & Processing...' : 'Place Secure Curation Order' }}</span>
          </BaseButton>
        </form>
      </div>

      <!-- Checkout Summary Sidebar -->
      <div class="checkout-summary-section">
        <div class="summary-card">
          <h3 class="summary-title">Order Overview</h3>

          <!-- Items Mini List -->
          <ul class="summary-items-list">
            <li v-for="item in cartStore.cart?.items" :key="item._id" class="summary-item-row">
              <div class="summary-item-info">
                <span class="summary-item-qty">{{ item.quantity }}x</span>
                <span class="summary-item-name">{{ item.productId?.name }}</span>
              </div>
              <span class="summary-item-price">
                ${{ ((item.productId?.price || 0) * item.quantity).toFixed(2) }}
              </span>
            </li>
          </ul>

          <!-- Totals -->
          <div class="summary-breakdown">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${{ cartStore.totals.subtotal.toFixed(2) }}</span>
            </div>

            <div v-if="cartStore.totals.discount > 0" class="summary-row summary-row--discount">
              <span>Promo Discount ({{ cartStore.cart?.promoCode }})</span>
              <span>-${{ cartStore.totals.discount.toFixed(2) }}</span>
            </div>

            <div class="summary-row">
              <span>Shipping</span>
              <span>{{ cartStore.totals.shipping === 0 ? 'Free' : `$${cartStore.totals.shipping.toFixed(2)}` }}</span>
            </div>

            <div class="summary-row">
              <span>Registry Tax (10%)</span>
              <span>${{ cartStore.totals.tax.toFixed(2) }}</span>
            </div>

            <div class="summary-row summary-row--total">
              <span>Total Curation Value</span>
              <span>${{ cartStore.totals.total.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Trust Badges -->
          <div class="checkout-trust-row">
            <span class="trust-badge">
              <Lock class="trust-badge-icon" /> 256-Bit SSL Secured
            </span>
            <span class="trust-badge">
              <Sparkles class="trust-badge-icon" /> Guaranteed Handshake
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-view {
  width: 100%;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--color-muted);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 32px;
  transition: color var(--duration-fast) var(--ease-out);
}

.back-btn:hover {
  color: var(--color-accent);
}

.back-icon {
  width: 16px;
  height: 16px;
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

/* Grid Layout */
.checkout-grid {
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 48px;
  align-items: start;
}

@media (max-width: 992px) {
  .checkout-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

/* Card & Form */
.checkout-form-card {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  box-shadow: var(--shadow-card);
  text-align: left;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.submit-error-banner {
  background-color: rgba(229, 72, 77, 0.08);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: 14px 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-col-full {
  grid-column: span 2;
}

@media (max-width: 576px) {
  .form-grid > div {
    grid-column: span 2;
  }
  .checkout-form-card {
    padding: 24px;
  }
}

/* Payment Notice */
.payment-notice-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background-color: rgba(15, 61, 94, 0.04);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.payment-icon {
  width: 24px;
  height: 24px;
  color: var(--color-accent-3);
  flex-shrink: 0;
}

.payment-notice-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.payment-notice-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-primary);
}

.payment-notice-desc {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--color-muted);
  line-height: 1.5;
}

.btn-place-order {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 16px !important;
  font-size: 1rem !important;
}

.btn-lock-icon {
  width: 16px;
  height: 16px;
}

/* Summary Sidebar */
.checkout-summary-section {
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
  text-align: left;
}

.summary-title {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 16px;
}

.summary-items-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 16px;
}

.summary-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-sans);
  font-size: 0.9rem;
}

.summary-item-info {
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--color-primary);
}

.summary-item-qty {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--color-accent);
}

.summary-item-name {
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.summary-item-price {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-primary);
}

/* Breakdown */
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

.summary-row--total {
  border-top: 2px dashed var(--color-border);
  padding-top: 16px;
  margin-top: 4px;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-primary);
}

.summary-row--total span:last-child {
  font-size: 1.25rem;
  color: var(--color-accent);
  font-family: var(--font-mono);
}

/* Trust Row */
.checkout-trust-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-muted);
}

.trust-badge {
  display: flex;
  align-items: center;
  gap: 4px;
}

.trust-badge-icon {
  width: 12px;
  height: 12px;
}
</style>
