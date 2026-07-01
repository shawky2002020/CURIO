# Orders, Payments, Dashboards & Multi-Seller Module — CURIO

This module introduces a comprehensive order tracking, payment processing, administrative dashboards, analytics, and multi-seller fulfillment management system to the CURIO platform.

---

## 1. Overview

The Orders & Payments Module manages the final stages of the curation lifecycle. It handles:

- Secure redirection to payment gateways (Stripe) and **Cash on Delivery (COD)** checkout
- Transaction recording and payment verification
- Enterprise-grade HTML email notifications
- Role-based order history dashboards for admins, sellers, and buyers
- **Admin & Seller Dashboard analytics** with real-time statistics insight cards
- **Server-side pagination** across all admin and seller management pages
- **Multi-seller order architecture** with per-seller item isolation and partial cancellation
- Automated inventory restoration on order cancellation

---

## 2. File Structure

### Backend Modules (`server/src`)

- `server/src/config/env.ts` — Validates Stripe keys
- `server/src/modules/cart/`
  - `order.model.ts` — Order schema with Stripe, COD payment method tracking
  - `order.service.ts` — Stripe session, COD checkout, multi-seller cancellation, stats aggregation, backend pagination, email notifications
  - `order.controller.ts` — HTTP handlers for checkout, verification, history, and status updates
  - `cart.routes.ts` — Express router mappings for all order endpoints
- `server/src/modules/seller/`
  - `seller.service.ts` — Dashboard KPI aggregation, monthly sales/revenue timeline, low stock detection
  - `seller.controller.ts` — HTTP handler for dashboard data and logo upload
  - `seller.product.service.ts` — Seller-scoped product CRUD, image upload, soft-delete, and stock patch
  - `seller.product.controller.ts` — HTTP handlers for seller product management
  - `seller.review.service.ts` — Paginated review fetching and seller reply persistence
  - `seller.review.controller.ts` — HTTP handlers for reviews and replies
  - `seller.routes.ts` — All `/api/seller/*` route definitions with auth, role, and upload middleware
- `server/src/modules/products/product.service.ts` — Product stats aggregation pipeline for admin/seller dashboards
- `server/src/modules/users/user.service.ts` — User and seller listing with stats counts and backend pagination
- `server/src/utils/emailTemplates.ts` — Responsive HTML layouts for order receipts and status notifications
- `server/src/services/email.service.ts` — SMTP mailer with optional authentication
- `server/src/services/storage.service.ts` — Cloud/S3 storage adapter for product images and seller logos
- `server/src/seed.ts` — Seeder script to initialize mock users, sellers, admins, and products
- `server/src/seed-dashboard.ts` — Extended seeder with orders, reviews, and sales data for dashboard charts

### Frontend Components (`client/src`)

- `client/src/api/cart.api.ts` — Axios API methods for payment verification, history (with pagination params), and status updates
- `client/src/api/admin.api.ts` — Admin-specific API calls for orders, products, users, sellers (with pagination and stats)
- `client/src/stores/cart.store.ts` — Pinia store with payment redirect and conditional cart-clear support
- `client/src/modules/cart/pages/`
  - `CheckoutPage.vue` — Client-side trigger for Stripe or COD checkout with payment method selector UI
  - `OrderSuccessPage.vue` — Stripe verification handler, visual delivery tracking timeline
- `client/src/modules/profile/pages/ProfilePage.vue` — Member Hub with Curation Order History table
- `client/src/modules/admin/pages/`
  - `AdminOrdersPage.vue` — Order management with stats cards, filters, backend pagination, and Order Management Sheet modal
  - `AdminProductsPage.vue` — Product moderation with stats cards, filters, and backend pagination
  - `AdminUsersPage.vue` — User management with stats cards, role filters, and backend pagination
  - `AdminSellersPage.vue` — Seller management with stats cards and backend pagination
  - `AdminDashboardPage.vue` — Central admin overview hub
  - `AdminBannersPage.vue`, `AdminCategoriesPage.vue`, `AdminCouponsPage.vue`, `AdminReviewsPage.vue` — Additional management pages
- `client/src/modules/seller/pages/`
  - `SellerDashboardPage.vue` — Command center with KPI cards and interactive Chart.js bar/line charts
  - `SellerOrdersPage.vue` — Fulfillment dashboard with stats cards, multi-seller detection, and Order Receipt Slip modal
  - `SellerProductsPage.vue` — Product management with stats cards, CRUD operations, image upload, and backend pagination
  - `SellerInventoryPage.vue` — Inline stock editor with low-stock alerts and per-row save
  - `SellerReviewsPage.vue` — Review feed with star ratings, pagination, and reply modal
  - `SellerProfilePage.vue` — Store profile editor with logo upload
- `client/src/modules/seller/components/`
  - `SellerProductForm.vue` — Rich product create/edit form (name, price, stock, category, images)
  - `SellerProductImageUploader.vue` — Drag-and-drop multi-image uploader with S3/cloud storage support
  - `SellerLogoUploader.vue` — Store logo uploader with live preview
  - `SellerProfileForm.vue` — Store bio, contact details, and branding editor
- `client/src/api/seller.api.ts` — Seller-scoped Axios API calls (dashboard, reviews, profile, logo)
- `client/src/api/seller.products.api.ts` — Seller product CRUD and image upload API methods
- `client/src/stores/sellerProduct.store.ts` — Pinia store managing seller product list, filters, and pagination state
- `client/src/layouts/SellerLayout.vue` — Sidebar layout wrapping all seller pages
- `client/src/components/ui/BasePagination.vue` — Reusable pagination component (emits `@change` event)

---

## 3. Database Schema Enhancements

We extended the `Order` Mongoose schema with payment gateway parameters and COD support:

### `Order` Schema Additions

| Field | Type | Description |
|---|---|---|
| `stripeSessionId` | String (optional) | Unique identifier returned by the Stripe Checkout session |
| `paymentStatus` | Enum: `pending \| paid \| failed` | Finalized state of the payment intent (default: `pending`) |
| `paymentMethod` | Enum: `card \| cash` | Selected payment method during checkout (default: `card`) |

When a COD order is later marked as `delivered`, the `paymentStatus` is automatically set to `paid` by the backend.

---

## 4. API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/checkout` | Generates Stripe session or processes COD order based on `paymentMethod` |
| `POST` | `/api/orders/:id/verify-payment` | Verifies Stripe session, clears cart, marks order paid |
| `GET` | `/api/orders` | Role-based order history with backend pagination and global stats |
| `PATCH` | `/api/orders/:id/status` | Advances order status; applies multi-seller isolation rules |

### Role-Based Order Listing

The `getOrders` service accepts `page`, `limit`, `status`, and `search` query params:

- **Customers/Collectors**: Fetches their own personal orders.
- **Sellers**: Fetches only orders that contain products belonging to their account.
- **Admins**: Fetches all orders across the platform.

---

## 5. Key Features & Business Logic

---

### 5.1 Pay by Cash (Cash on Delivery — COD)

The checkout flow supports two payment methods: **Stripe Card** and **Cash on Delivery (COD)**.

#### Frontend — `CheckoutPage.vue`
The checkout page renders a payment method selector. When the user picks **Cash on Delivery**, the Stripe redirect is bypassed and the order is submitted with `paymentMethod: 'cash'`.

#### Backend — `order.service.ts: checkout()`
When `paymentMethod === 'cash'` is received:
1. The order is created with `status: 'confirmed'` (skipping the `pending` stage).
2. Product stock is decremented immediately to reserve inventory.
3. The cart is cleared instantly — no Stripe webhook is needed.
4. If a promo code was applied, its `usedCount` is incremented.
5. An HTML order confirmation email is dispatched to the buyer.

```typescript
// COD orders skip Stripe — they go straight to 'confirmed'
status: paymentMethod === 'cash' ? 'confirmed' : 'pending',
```

When a COD order is marked as `delivered`, the backend automatically transitions `paymentStatus` to `paid`:

```typescript
if (status === 'delivered' && order.paymentMethod === 'cash') {
  order.paymentStatus = 'paid';
}
```

#### Display in Dashboards
All order tables and detail modals display the payment method as **"COD"** (Cash on Delivery) or **"Stripe"** depending on the stored `paymentMethod` field.

---

### 5.2 Multi-Seller Order Architecture

When a buyer places an order containing products from **more than one seller**, the platform applies special multi-seller rules to protect both sellers and buyers.

#### Detection Logic — Backend

```typescript
const sellerIds = new Set(productsInOrder.map((p) => p.seller.toString()));
const isMultiSeller = sellerIds.size > 1;
```

#### Role Restrictions — `order.service.ts: updateOrderStatus()`

| Action | Admin | Seller (single-vendor) | Seller (multi-vendor) |
|---|---|---|---|
| Advance status (confirm → ship → deliver) | ✅ Allowed | ✅ Allowed | ❌ Forbidden |
| Cancel their own items only | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Cancel the full order | ✅ Allowed | ✅ (if sole vendor) | ❌ Not applicable |

Sellers on multi-seller orders **cannot** advance the global order status. This prevents one seller from prematurely marking an order as "Shipped" when another seller's items haven't been dispatched. Only admins can manage the lifecycle of mixed-vendor orders.

#### Seller "Cancel My Portion" Flow

When a seller in a multi-vendor order cancels, the backend performs a **partial cancellation**:

1. Identifies only the items belonging to the requesting seller.
2. Removes those items from `order.items`.
3. Restores stock for the removed items: `$inc: { stock: item.quantity }`.
4. Recalculates order totals (subtotal, tax, grand total) based on remaining items.
5. Saves the updated order.
6. Sends an email notification to the buyer with the revised order total.

```typescript
// Recalculate totals after partial cancellation
const newSubtotal = otherItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
order.totals.subtotal = newSubtotal;
order.totals.tax = Math.round(newSubtotal * 0.1 * 100) / 100;
order.totals.total = Math.max(0, newSubtotal + order.totals.shipping + order.totals.tax - order.totals.discount);
```

#### Frontend — `SellerOrdersPage.vue`

- Multi-seller orders display a **"Multi-Studio"** badge in the status column.
- The fulfillment action buttons (Confirm, Processing, Shipped, Delivered) are **hidden** for multi-seller orders.
- A **"Cancel My Portion"** button (always visible for non-delivered, non-cancelled orders) triggers the partial cancellation flow with a descriptive confirmation dialog.
- The Order Receipt Slip modal shows **only the seller's own products** and their individual subtotal ("Net Studio Claim").
- An informational notice is shown: *"Central admin manages fulfillment logistics for multi-vendor transactions."*

---

### 5.3 Dashboard Analytics — Statistics Insights Cards

All admin and seller dashboard pages feature a **Statistics Insights** banner at the top. These cards provide at-a-glance totals across all status categories, even when a filter is active.

#### How It Works

The backend uses a separate `statsQuery` that intentionally **excludes** the active status or search filter. This ensures card totals always reflect the global picture, not just the currently filtered subset.

```typescript
// Strip active filters from stats query to keep counts globally accurate
const statsQuery = { ...query };
delete statsQuery.status;
delete statsQuery.$or;

const statusCounts = await Order.aggregate([
  { $match: statsQuery },
  { $group: { _id: '$status', count: { $sum: 1 } } }
]);
```

#### Pages with Insight Cards

| Page | Stats Shown |
|---|---|
| **Admin Orders** | Total, Pending, Confirmed, Processing, Shipped, Delivered, Cancelled |
| **Seller Orders** | Total, Pending, Confirmed, Processing, Shipped, Delivered, Cancelled |
| **Admin Products** | Total, Active, Draft, Archived, Out of Stock |
| **Seller Products** | Total, Active, Draft, Archived, Out of Stock |
| **Admin Users** | Total Users, Active, Sellers, Admins |
| **Admin Sellers** | Total Sellers, Active, Pending Approval |

#### Color Coding

| Status | Border Color |
|---|---|
| Pending | Amber `#d97706` |
| Confirmed | Sky Blue `#0284c7` |
| Processing | Violet `#7c3aed` |
| Shipped | Yellow `#f59e0b` |
| Delivered | Green `#059669` |
| Cancelled | Red `#dc2626` |

---

### 5.4 Backend-Driven Pagination

All admin and seller listing pages use **server-side pagination** via the reusable `BasePagination` component.

#### How It Works

1. Each page tracks a `pagination` ref: `{ page, limit, total, pages }`.
2. On mount and on filter/search changes (with a 350ms debounce), the page calls its data-fetching function with `page`, `limit`, `search`, and `status` parameters.
3. The API response includes `orders` (or items), `total`, `pages`, `page`, and `stats`.
4. `BasePagination` is rendered only when `pagination.pages > 1` (i.e., more than 10 items exist).
5. `BasePagination` emits the `@change` event which triggers `handlePageChange(newPage)`.

```vue
<BasePagination
  :currentPage="pagination.page"
  :totalPages="pagination.pages"
  @change="handlePageChange"
/>
```

#### Pages Using Backend Pagination

- `AdminOrdersPage.vue`
- `AdminProductsPage.vue`
- `AdminUsersPage.vue`
- `AdminSellersPage.vue`
- `SellerOrdersPage.vue`
- `SellerProductsPage.vue`
- `CatalogPage.vue` (user-facing product catalog)

---

### 5.5 Visual Tracking Timeline

The `OrderSuccessPage.vue` features a dynamic, color-coded visual tracking pipeline:

```
Placed → Paid → Processing → Shipped → Delivered
```

---

### 5.6 Admin Order Management Sheet Modal

Admins access an **Order Management Sheet** modal from `AdminOrdersPage.vue` containing:

- **Customer & Delivery** panel — full name, email, phone, destination address
- **Logistics & Auditing** panel — order creation date, payment method (COD / Stripe Card), payment status badge, global status badge
- **Ordered Items Audit** table — product thumbnail, name, seller attribution, unit price, quantity, line total
- **Receipt Breakdown** — subtotal, promo code discount (if applicable), shipping fee, taxes (10%), grand total

---

### 5.7 Seller Order Receipt Slip Modal

Sellers access a premium **Order Receipt Slip** modal from `SellerOrdersPage.vue` containing:

- Branded **CURIO REGISTER SLIP** header with the truncated Order ID
- Copy-to-clipboard button for the full Reference ID
- **Multi-Studio Fulfillment** pill badge (if the order has multiple sellers)
- **Buyer Info** card — name, email, phone, shipping address
- **Transaction Info** card — date, payment type (COD / Stripe Card), payment status, multi-vendor admin notice
- **Curated Items** table — only the seller's own products with thumbnails and reference IDs
- **Net Studio Claim** summary — the seller's portion subtotal only

---

### 5.8 SMTP Notification Ecosystem

Using `nodemailer`, the platform generates enterprise-grade HTML emails:

| Trigger | Email Sent |
|---|---|
| Successful Stripe payment | Order Confirmation to buyer |
| COD checkout completion | Order Confirmation to buyer |
| Admin/Seller status advancement | Status Update notification to buyer |
| Seller partial cancellation (multi-vendor) | Partial Cancellation notice with new order total |

---

## 6. Seller Dashboard Module

The Seller Dashboard is a dedicated role-restricted area (`/seller/*`) accessible only to accounts with the `seller` role. It provides a comprehensive suite of tools for studio partners to manage their listings, track revenue, and handle customer relationships.

---

### 6.1 Seller Command Center — `SellerDashboardPage.vue`

The home page of the seller portal is a premium analytics command center built with **Chart.js** (via `vue-chartjs`).

#### KPI Stats Cards
Four top-level metric cards provide an instant business snapshot:

| Card | Metric |
|---|---|
| **Total Revenue** | Sum of item prices across all non-cancelled orders containing seller's products |
| **Total Orders** | Count of all orders containing at least one seller product |
| **Active Products** | Total non-deleted products in the seller's catalog |
| **Low Stock Alerts** | Products with stock between 1 and the admin-configured threshold |

#### Interactive Charts
- **Monthly Revenue Line Chart** — Plots revenue earned per month for the last 12 months. Cancelled orders are excluded from revenue.
- **Monthly Sales Bar Chart** — Plots total units sold per month for the last 12 months.

Both charts are powered by a backend aggregation in `seller.service.ts: getDashboardData()` which computes per-month breakdowns from raw order data.

#### Quick-Access Panels
- **Recent Orders** — A snapshot list of the seller's most recent orders with status badges.
- **Recent Reviews** — A list of the latest customer reviews with star ratings.

---

### 6.2 Seller Product Management — `SellerProductsPage.vue`

A full product lifecycle management page restricted to the seller's own catalog.

#### Features
- **Statistics Insight Cards** — Active, Draft, Archived, and Out of Stock counts (always global, filter-independent).
- **Search & Status Filter** — Debounced search and status dropdown for quick filtering.
- **Create Product** — Opens `SellerProductForm.vue` modal to create a new listing with name, description, price, stock, category, and images.
- **Edit Product** — Pre-populates the form with existing product data for inline editing.
- **Soft Delete** — Marks products as deleted without permanently removing them from the database.
- **Toggle Visibility** — Admins and sellers can archive/restore products to hide them from the public catalog.
- **Backend Pagination** — 10 items per page with `BasePagination`.

#### `SellerProductImageUploader.vue`
A drag-and-drop image uploader component that:
- Accepts multiple images per upload batch.
- Sends images via `POST /api/seller/products/:id/images` as `multipart/form-data`.
- Previews uploaded images immediately.
- Stores images via the cloud storage adapter (`storage.service.ts`).

---

### 6.3 Inventory Management — `SellerInventoryPage.vue`

A dedicated stock editor that allows sellers to update product quantities without entering the full product edit flow.

#### Features
- Inline editable stock fields — each row has a number input bound to the product's current stock.
- **Per-row Save** — Changes are committed individually via `PATCH /api/seller/products/:id/stock`, so sellers can update a single product without affecting others.
- **Input Validation** — Prevents negative values and non-integer entries before calling the API.
- **Low Stock Highlighting** — Products at or below the admin-configured `lowStockThreshold` are flagged with a warning indicator.
- Uses the shared `sellerProductStore` to avoid duplicate API calls between the Products and Inventory pages.

---

### 6.4 Customer Reviews — `SellerReviewsPage.vue`

A paginated review management page where sellers can read and respond to buyer feedback.

#### Features
- **Paginated Review Feed** — Fetches reviews via `GET /api/seller/reviews` with `page` and `limit` params.
- **Star Rating Display** — Uses the `StarRating` component to visually render review scores.
- **Reply Modal** — Clicking "Reply" on any review opens a modal with a text area. On submit, the reply is sent via `POST /api/seller/reviews/:reviewId/reply` and persisted to the review document.
- **Edit Reply** — If a reply already exists, the modal pre-populates with the existing text for editing.

---

### 6.5 Store Profile — `SellerProfilePage.vue` & `SellerProfileForm.vue`

Allows sellers to manage their public studio identity.

#### Features
- **Profile Editor (`SellerProfileForm.vue`)** — Edits store name, store description, contact information, and social links.
- **Logo Upload (`SellerLogoUploader.vue`)** — Uploads a store logo image via `POST /api/seller/upload-logo` with a live preview before submission. Uploaded via `multipart/form-data` and stored via the cloud storage adapter.

---

### 6.6 Seller API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/seller/dashboard` | Returns KPI stats and 12-month chart data for the seller |
| `POST` | `/api/seller/upload-logo` | Uploads and stores a store logo image |
| `GET` | `/api/seller/products` | Lists the seller's own products with filters and pagination |
| `POST` | `/api/seller/products` | Creates a new product in the seller's catalog |
| `PUT` | `/api/seller/products/:id` | Updates an existing product |
| `PATCH` | `/api/seller/products/:id/stock` | Updates only the stock quantity for a product |
| `DELETE` | `/api/seller/products/:id` | Soft-deletes a product |
| `POST` | `/api/seller/products/:id/images` | Uploads additional images for a product |
| `GET` | `/api/seller/reviews` | Lists reviews for seller's products with pagination |
| `POST` | `/api/seller/reviews/:reviewId/reply` | Adds or updates a seller reply to a review |

All routes are protected by the `auth` and `role('seller')` middlewares.

---

### 6.7 `sellerProductStore` — Pinia Store

The `sellerProduct.store.ts` manages the shared state used by both `SellerProductsPage` and `SellerInventoryPage`:

- `products` — Current page of seller products
- `filters` — Active search/status/category filters
- `pagination` — `{ page, limit, total, pages }`
- `lowStockThreshold` — Fetched from admin settings to highlight at-risk products
- `fetchProducts(page)` — Calls the seller products API with current filters
- `fetchLowStockThreshold()` — Fetches the admin-configured threshold setting

---

### 6.8 Seller Layout — `SellerLayout.vue`

All seller pages are wrapped in `SellerLayout.vue`, which provides:
- A collapsible **sidebar** with navigation links to all seller sections (Dashboard, Products, Inventory, Orders, Reviews, Profile)
- A persistent **top header** displaying the seller's store name and avatar
- Route-level guards ensuring only `seller` role accounts can access the layout

---

## 7. Setup & Configuration

### Stripe Configuration

Add your Stripe API keys to `server/.env` to enable live redirection:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

*Note: Leaving these values empty will automatically trigger the offline Sandbox Fallback flow — the cart is cleared and order is instantly marked as `processing` and `paid`.*

### SMTP Configuration

The email service supports unauthenticated SMTP for local mock servers like **smtp4dev**:

```env
EMAIL_HOST=localhost
EMAIL_PORT=2525
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=no-reply@curio.com
```

With this configuration, all order confirmations and status changes can be triggered locally without needing real SMTP App Passwords.

---

## 7. Summary of Enhancements

| Feature | Area | Description |
|---|---|---|
| **Pay by Cash (COD)** | Backend + Frontend | New checkout payment method; skips Stripe, auto-confirms, clears cart immediately |
| **COD Auto-Pay on Delivery** | Backend | COD orders automatically set `paymentStatus = 'paid'` when delivered |
| **Multi-Seller Detection** | Backend | Detects orders with items from >1 seller via product seller ID aggregation |
| **Seller Status Restriction** | Backend | Prevents sellers from advancing status on multi-vendor orders (admin-only) |
| **Seller Cancel My Portion** | Backend | Partial cancellation: removes seller items, recalculates totals, notifies buyer |
| **Dashboard Insights Cards** | Frontend | Status count cards on all admin & seller listing pages |
| **Global Stats Aggregation** | Backend | Stats pipeline excludes active filters, keeping counts globally accurate |
| **Backend Pagination** | Backend + Frontend | Server-side pagination on all admin & seller pages and the product catalog |
| **Multi-Studio UI Badge** | Frontend | Visual indicator for multi-vendor orders in the Seller Orders table |
| **Order Receipt Slip Modal** | Frontend | Premium seller receipt modal showing only the seller's own products |
| **Order Management Sheet** | Frontend | Admin modal with full order audit: customer, logistics, items, and receipt breakdown |
| **COD Display** | Frontend | All order tables and modals display payment method as "COD" or "Stripe" |
| **Seller Dashboard** | Frontend + Backend | KPI stats + 12-month Chart.js revenue & sales charts via `seller.service.ts` |
| **Seller Product CRUD** | Frontend + Backend | Full create/edit/delete/image-upload product management for sellers |
| **Seller Inventory Editor** | Frontend + Backend | Inline per-row stock editor with low-stock threshold alerts |
| **Seller Review Replies** | Frontend + Backend | Paginated review feed with modal reply composer and edit support |
| **Seller Store Profile** | Frontend + Backend | Profile form and logo uploader with cloud storage integration |
| **Seller Layout & Routing** | Frontend | Dedicated sidebar layout and role-guarded route group for `/seller/*` |
