# CURIO — Curated Objects & Exquisite Design

CURIO is a full-stack e-commerce monorepo application. It allows creators to list unique design objects and accessories.

The project is structured as a TypeScript monorepo using npm workspaces, with a Vue 3 frontend and an Express/MongoDB backend.

---

## 🛠️ Technology Stack

### Frontend (Client)
* **Core**: [Vue 3](https://vuejs.org/) (utilizing `<script setup lang="ts">` composition API)
* **State Management**: [Pinia](https://pinia.vuejs.org/) (modular, type-safe stores)
* **Routing**: [Vue Router](https://router.vuejs.org/) (with navigation guards and redirect history)
* **Styling**: Vanilla CSS (custom design system tokens and responsive grids)
* **Iconography**: [Lucide Vue](https://lucide.dev/) (vector SVG icons)
* **Build Tool**: [Vite](https://vite.dev/) (HMR compiler)
* **Charts**: [Chart.js](https://www.chartjs.org/) via `vue-chartjs` (seller dashboard analytics)

### Backend (Server)
* **Runtime & Framework**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) (TypeScript)
* **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/)
* **Authentication**: JWT Access & Refresh Tokens (with Token Rotation and Session Revocation)
* **Third-Party Auth**: Google OAuth 2.0 (Identity Services integration)
* **Email System**: SMTP email client via [Nodemailer](https://nodemailer.com/) (supporting connection pooling and secure delivery)
* **Payment**: [Stripe](https://stripe.com/) Checkout Sessions (with offline sandbox fallback)
* **File Storage**: Cloud/S3 storage adapter for product images and seller logos
* **Validation**: Custom lightweight `validate()` middleware with field-level schema rules

---

## ✨ Platform Features

| Feature | Description |
|---|---|
| **Authentication** | Email/password registration, Google OAuth 2.0, JWT refresh rotation, email verification, password reset |
| **User Roles** | Three-tier role system: `customer`, `seller`, `admin` with route-level guards |
| **Product Catalog** | Live search, category filtering, price ranges, star ratings, reviews, wishlist |
| **Shopping Cart** | Guest & member cart persistence, promo codes (% and fixed), real-time stock validation |
| **Checkout** | Stripe Card payment + Cash on Delivery (COD), order confirmation emails |
| **Order Management** | Full lifecycle tracking (Pending → Confirmed → Processing → Shipped → Delivered) |
| **Multi-Seller Orders** | Per-seller item isolation, partial cancellation, admin-only status advancement |
| **Admin Dashboard** | Manage users, sellers, products, orders, categories, banners, coupons, reviews |
| **Seller Dashboard** | KPI analytics with Chart.js, product CRUD, inventory editor, review replies, store profile |
| **Email Notifications** | Order confirmations, status updates, partial cancellation notices via SMTP |
| **Dashboard Analytics** | Real-time stats insight cards + backend pagination on all listing pages |

---

## 👥 Team Members

### Shawky Ahmad Shawky — Frontend Developer & UI Designer
**Module:** Authentication & Users

| Area | What Was Built |
|---|---|
| **Design System** | Global CSS custom properties (color palette, fonts, shadows, animations) in `style.css` |
| **Authentication UI** | Login, Register pages with route guards and OAuth redirect flows |
| **Email Verification** | SMTP email verification flow for user registration |
| **User Profiles** | User profile management and multi-role system (Customer, Seller, Admin) |
| **Wishlist** | Wishlist & Favorites with `CatalogPage.vue` integration |
| **Toast System** | Global `toast.store.ts` + `BaseToastContainer.vue` for notifications |
| **Axios Layer** | `http.ts` interceptors for token refresh, 401 handling, and credential errors |
| **Monorepo Setup** | npm workspaces root `package.json`, `.gitignore`, unified lockfile |
| **Iconography** | Replaced all raw/emoji icons with Lucide Vue SVG components |

👉 [Full Documentation](docs/shawky-ahmad-shawky/README.md)

---

### Mazen Raafat Abdelhameed — Full-Stack Developer
**Module:** Product Catalog

| Area | What Was Built |
|---|---|
| **Database Models** | `category.model.ts`, `product.model.ts` (full-text index), `review.model.ts` (unique per user/product) |
| **Service Layer** | `category.service.ts`, `product.service.ts` (search/filter/CRUD), `review.service.ts` (auto rating recalculation) |
| **Product API** | 13 endpoints: categories CRUD, products CRUD + search/filter, reviews CRUD with ownership checks |
| **Catalog Page** | `CatalogPage.vue` rewritten to consume live API with skeleton loading and error states |
| **Product Detail** | `ProductDetailPage.vue` — image gallery, rating summary, seller info, reviews section + submission form |
| **Admin Products** | `AdminProductsPage.vue` — table with thumbnails, status badges, create/edit modal, double-confirm delete |
| **Admin Categories** | `AdminCategoriesPage.vue` — category CRUD with modal form |
| **Reusable Components** | `StarRating.vue`, `ProductCard.vue`, `ProductFilterBar.vue` |
| **Pinia Stores** | `category.store.ts`, `product.store.ts` with typed filters and full CRUD actions |

👉 [Full Documentation](docs/mazen-raafat-abdelhameed/README.md)

---

### Moamen Alaa Soltan — Full-Stack Developer
**Module:** Cart & Checkout

| Area | What Was Built |
|---|---|
| **Database Models** | `cart.model.ts` (guest + member), `order.model.ts`, `promo.model.ts` (percentage & fixed discount) |
| **Cart Service** | Add/update/remove items, duplicate merging, stock validation, promo code application, login cart merge |
| **Pricing Engine** | Subtotal → promo discount → flat-rate shipping (free over $100) → 10% tax → grand total |
| **Cart API** | 7 cart endpoints + checkout + order retrieval |
| **Guest Session** | `resolveCartOwner.middleware.ts` soft-auth with `x-guest-id` UUID header tracking |
| **Cart Page** | `CartPage.vue` — item list, quantity controls, promo form, financial summary, clear cart |
| **Checkout Page** | `CheckoutPage.vue` — validated shipping form, order overview, payment trigger |
| **Order Success** | `OrderSuccessPage.vue` — confetti success screen with order reference and shipping details |
| **Pinia Store** | `cart.store.ts` — cart state, toasts, loading, totals |

👉 [Full Documentation](docs/Moamen%20Alaa%20Soltan/README.md)

---

### Hassan Muhammad — Full-Stack Developer
**Module:** Orders & Payments

| Area | What Was Built |
|---|---|
| **Stripe Integration** | Checkout session generation mapping cart structure (items, shipping, tax, discount) into Stripe line items |
| **Payment Verification** | `POST /api/orders/:id/verify-payment` — verifies Stripe session, clears cart, marks order paid |
| **Sandbox Fallback** | When `STRIPE_SECRET_KEY` is empty, bypasses Stripe and instantly marks order as `processing` + `paid` |
| **Order Tracking** | Visual color-coded status timeline: Placed → Paid → Processing → Shipped → Delivered |
| **Status Management** | Admin/Seller status advancement dropdown with inventory restoration on cancellation |
| **Email Notifications** | Order confirmation emails on payment + status update emails on every transition |
| **Role-Based History** | `GET /api/orders` returns customer-specific, seller-specific, or all orders based on role |
| **Order Schema** | Extended with `stripeSessionId` and `paymentStatus` fields |

👉 [Full Documentation](docs/hassan-muhammad/README.md)

---

### Hassan Abdelhamed — Full-Stack Developer
**Module:** Admin & Seller Dashboard

| Area | What Was Built |
|---|---|
| **Pay by Cash (COD)** | New payment method: skips Stripe, auto-confirms order, clears cart, auto-marks `paid` on delivery |
| **Multi-Seller Orders** | Mixed-vendor detection; sellers blocked from advancing status; "Cancel My Portion" with partial stock restoration and total recalculation |
| **Admin Orders** | `AdminOrdersPage` — order management with stats cards, search/filter, pagination, and Order Management Sheet modal |
| **Admin Products** | `AdminProductsPage` — product moderation with stats cards, filters, and backend pagination |
| **Admin Users** | `AdminUsersPage` — user management with stats cards, role filters, and backend pagination |
| **Admin Sellers** | `AdminSellersPage` — seller management with stats cards and backend pagination |
| **Seller Dashboard** | `SellerDashboardPage` — KPI cards (revenue, orders, products, low stock) + Chart.js 12-month revenue and sales charts |
| **Seller Product CRUD** | `SellerProductsPage`, `SellerProductForm`, `SellerProductImageUploader` — create/edit/soft-delete with image upload |
| **Seller Inventory** | `SellerInventoryPage` — per-row inline stock editor with low-stock threshold alerts |
| **Seller Reviews** | `SellerReviewsPage` — paginated review feed with star ratings and reply modal |
| **Seller Profile** | `SellerProfilePage`, `SellerProfileForm`, `SellerLogoUploader` — store identity editor with cloud logo upload |
| **Dashboard Analytics** | Global stats aggregation pipeline (filter-independent) on all admin/seller listing pages |
| **Backend Pagination** | Server-side pagination via `BasePagination.vue` across admin, seller, and catalog pages |
| **Seller Backend** | `seller.service.ts`, `seller.product.service.ts`, `seller.review.service.ts` + controllers and routes |

👉 [Full Documentation](docs/hassan-abdelhamed/README.md)

---

## 📂 Monorepo Architecture

```
CURIO/
├── package.json                    # Monorepo workspaces & dependency definitions
├── package-lock.json               # Unified lockfile
├── .gitignore                      # Root Git exclusion rules
├── docs/
│   ├── shawky-ahmad-shawky/        # Shawky's contribution docs
│   ├── mazen-raafat-abdelhameed/   # Mazen's contribution docs
│   ├── Moamen Alaa Soltan/         # Moamen's contribution docs
│   ├── hassan-muhammad/            # Hassan Muhammad's contribution docs
│   └── hassan-abdelhamed/          # Hassan Abdelhamed's contribution docs
├── client/                         # Vue 3 Frontend SPA (curio-client)
│   └── src/
│       ├── api/                    # Axios service wrappers per module
│       ├── components/
│       │   ├── ui/                 # BaseButton, BaseTable, BaseModal, BasePagination, etc.
│       │   └── layout/             # Header, Sidebar
│       ├── layouts/                # AdminLayout, SellerLayout, MainLayout
│       ├── modules/
│       │   ├── auth/               # Login, Register pages
│       │   ├── catalog/            # CatalogPage, ProductDetailPage, components
│       │   ├── cart/               # CartPage, CheckoutPage, OrderSuccessPage
│       │   ├── profile/            # ProfilePage (order history)
│       │   ├── admin/              # AdminDashboard, Orders, Products, Users, Sellers, etc.
│       │   └── seller/             # SellerDashboard, Orders, Products, Inventory, Reviews, Profile
│       ├── router/                 # Vue Router with guards
│       ├── stores/                 # Pinia stores (auth, cart, product, category, seller, toast)
│       └── style.css               # Global design system CSS tokens
└── server/                         # Node.js Express API (curio-server)
    └── src/
        ├── config/                 # env.ts validation
        ├── middlewares/            # auth, role, validate, upload, resolveCartOwner
        ├── modules/
        │   ├── auth/               # Login, register, token refresh, Google OAuth
        │   ├── users/              # User CRUD, profile, wishlist
        │   ├── products/           # Categories, products, reviews
        │   ├── cart/               # Cart, orders, promo codes, checkout
        │   ├── seller/             # Seller dashboard, product management, reviews
        │   ├── admin/              # Admin services, settings model
        │   └── banners/            # Banner CRUD
        ├── services/               # email.service.ts, storage.service.ts
        ├── utils/                  # ApiError, asyncHandler, emailTemplates, sanitizeUser
        ├── seed.ts                 # Main seeder
        └── seed-dashboard.ts       # Dashboard data seeder (orders, reviews, charts)
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a remote MongoDB Atlas URI)

### 2. Dependency Installation
Run the following from the root of the repository to install and link all dependencies:
```bash
npm install
```

### 3. Environment Configuration

#### Backend (`server/.env`)
Create a `.env` file inside `server/` and configure:
```ini
# Server Settings
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/curio_db

# JWT
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Client Origin
CLIENT_URL=http://localhost:5173


# OAuth Credentials
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

#### Frontend (`client/.env`)
Create a `.env` file inside the `client/` directory and configure the following:
```ini
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 4. Running the Application
To start both the client and server development servers concurrently, run this command from the root directory:
```bash
npm run dev
```
* The **Frontend Client** will be available at: `http://localhost:5173`
* The **Backend Server** will run at: `http://localhost:5000`

### 5. Seeding the Database

Seed core data (users, sellers, products, categories, promo codes):
```bash
cd server
npx tsx src/seed.ts
```

Seed dashboard analytics data (orders, reviews, sales history for charts):
```bash
npx tsx src/seed-dashboard.ts
```

---

## 📧 Local Email Testing with smtp4dev

To test email flows locally without sending real emails, use **smtp4dev** — a mock SMTP server:

```bash
docker run --name smtp4dev -p 3000:80 -p 2525:25 -d rnwood/smtp4dev
```

* **Web Dashboard**: `http://localhost:3000` — view all intercepted emails
* **SMTP Port**: `2525`

All order confirmations, status notifications, and verification emails will appear in the smtp4dev dashboard instead of being delivered to real inboxes.

---

## 📖 Module Documentation

Each team member maintains detailed technical documentation for their module:

| Module | Owner | Documentation |
|---|---|---|
| Authentication & Users | Shawky Ahmad Shawky | [docs/shawky-ahmad-shawky/README.md](docs/shawky-ahmad-shawky/README.md) |
| Product Catalog | Mazen Raafat Abdelhameed | [docs/mazen-raafat-abdelhameed/README.md](docs/mazen-raafat-abdelhameed/README.md) |
| Cart & Checkout | Moamen Alaa Soltan | [docs/Moamen%20Alaa%20Soltan/README.md](docs/Moamen%20Alaa%20Soltan/README.md) |
| Orders & Payments | Hassan Muhammad | [docs/hassan-muhammad/README.md](docs/hassan-muhammad/README.md) |
| Admin & Seller Dashboard | Hassan Abdelhamed | [docs/hassan-abdelhamed/README.md](docs/hassan-abdelhamed/README.md) |
