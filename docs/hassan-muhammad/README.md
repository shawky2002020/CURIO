# Orders & Payments Module - CURIO

This module introduces a comprehensive order tracking, payment processing, and administrative status management system to the CURIO platform.

---

## 1. Overview

The Orders & Payments Module manages the final stages of the curation lifecycle. It handles secure redirection to payment gateways (Stripe), records transaction references, dispatches HTML email notifications, provides role-based order history dashboards, and enables administrative status controls with automated inventory restoration.

---

## 2. File Structure

### Backend Modules (`server/src`)

- `server/src/config/env.ts` (Validates Stripe keys)
- `server/src/modules/cart/`
  - `order.model.ts` (Order schema augmented with Stripe tracking)
  - `order.service.ts` (Stripe session creation, order payment verification, email notifications, role-based order lists, and status updates)
  - `order.controller.ts` (HTTP handlers for checkout, verification, fetching history, and patching status)
  - `cart.routes.ts` (Express router mappings for the order endpoints)
- `server/src/utils/emailTemplates.ts` (Responsive HTML layouts for order receipts and status advancement notifications)
- `server/src/services/email.service.ts` (SMTP mailer configured for optional authentication)
- `server/src/seed.ts` (Seeder script to initialize mock users, sellers, admins, and products)

### Frontend Components (`client/src`)

- `client/src/api/cart.api.ts` (Axios API methods for payment verification, history fetching, and status updates)
- `client/src/stores/cart.store.ts` (Pinia store adaptations to support payment redirects and conditional cart clearing)
- `client/src/modules/cart/pages/`
  - `CheckoutPage.vue` (Client-side trigger for Stripe redirection)
  - `OrderSuccessPage.vue` (Handles Stripe verification, displays a visual delivery tracking timeline, and houses admin/seller status controls)
- `client/src/modules/profile/pages/ProfilePage.vue` (Member Hub featuring the Curation Order History table)

---

## 3. Database Schema Enhancements

We extended the `Order` Mongoose schema with payment gateway parameters:

### `Order` Enhancements

- `stripeSessionId` (String, optional): The unique identifier returned by the Stripe Checkout session.
- `paymentStatus` (String enum: `pending`, `paid`, `failed`, default `pending`): The finalized state of the payment intent.

---

## 4. API Endpoints

- `POST   /api/checkout` — Generates a Stripe checkout session based on the cart line items (tax, shipping, discounts) and returns a secure session URL for redirection.
- `POST   /api/orders/:id/verify-payment` — Verifies a successful Stripe checkout session, clears the user's cart, marks the order as paid, and dispatches the confirmation email.
- `GET    /api/orders` — Retrieves order history dynamically based on the user's role:
  - **Customers/Collectors**: Fetches their own personal orders.
  - **Sellers**: Fetches orders containing products they sell.
  - **Admins**: Fetches all orders across the platform.
- `PATCH  /api/orders/:id/status` — Secured endpoint (Admins/Sellers only) to advance the status of an order. Dispatches SMTP email notifications on change.

---

## 5. Key Features & Business Logic

### Payment Processing
- **Stripe Checkout**: Accurately maps the cart's exact structure (individual item lines, dedicated shipping fee line, tax line, and negative discount lines) into Stripe's pricing data structure.
- **Offline Sandbox Fallback**: If `STRIPE_SECRET_KEY` is not defined in the `.env` (default local testing behavior), the system bypasses Stripe entirely, instantly clears the cart, and marks the order as `processing` and `paid` to allow seamless local development.

### Visual Tracking Timeline
- The Order Details page (`OrderSuccessPage.vue`) features a dynamic, color-coded visual tracking pipeline mapping the status flow:
  `Placed` $\rightarrow$ `Paid` $\rightarrow$ `Processing` $\rightarrow$ `Shipped` $\rightarrow$ `Delivered`

### Status Management & Inventory Integrity
- **Administrative Controls**: Logged-in Sellers and Admins gain access to a dedicated "Advance Order Status" dropdown directly on the Order Details view.
- **Stock Restoration**: If an admin or seller updates an order's status to `cancelled`, the backend loops through the order items and automatically increments (replenishes) the `stock` counts back into the global inventory.

### SMTP Notification Ecosystem
- Using `nodemailer`, the platform generates enterprise-grade HTML emails:
  - **Order Confirmations**: Sent instantly upon successful payment verification.
  - **Status Updates**: Sent automatically whenever an admin or seller advances the curation status (e.g., from Processing to Shipped).

---

## 6. Setup & Configuration

### Stripe Configuration

Add your Stripe API keys to the `server/.env` to enable live redirection:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

*Note: Leaving these values empty will automatically trigger the offline Sandbox Fallback flow.*

### SMTP Configuration

As implemented, the email service supports unauthenticated SMTP for local mock servers like **smtp4dev**.

```env
# Email Settings (SMTP)
EMAIL_HOST=localhost
EMAIL_PORT=2525
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=no-reply@curio.com
```

With this configuration, you can safely trigger all order confirmations and status changes locally without needing real SMTP App Passwords.
