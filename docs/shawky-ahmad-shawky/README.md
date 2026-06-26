# Shawky Ahmad Shawky
## Role: Frontend Developer & UI Designer

I worked on the user interface, design system, and authentication features for the CURIO e-commerce application. Below is a summary of the features and modifications I completed.

---

## 🛠️ Features Completed

### 1. UI Design and Stylesheet Overhaul
* **Core Stylesheet (`client/src/style.css`)**:
  * Set the color palette: off-white cream (`#fff8ef`), sandy-beige (`#f7efe5`), brand navy (`#17143f`), and coral orange (`#ff6b35`).
  * Configured the fonts: Fredoka (headings), Space Grotesk (subtitles and buttons), and Plus Jakarta Sans (body text).
  * Added custom input field styles, shadow depths, and page transition animations.
  * Ensured keyboard focus indicators and reduced-motion settings are respected.

### 2. Product Catalog Page
* **Catalog View (`client/src/modules/catalog/pages/CatalogPage.vue`)**:
  * Created the main product listing page with catalog search and category filtering.
  * Integrated wishlist buttons directly onto product cards.

### 3. Iconography Updates
* **Lucide Vue Integration (`@lucide/vue`)**:
  * Removed all raw text, emoji, and custom CSS icons.
  * Replaced them with Lucide SVG icon components (like Lock, Sparkles, Heart, Package, Star, and ShieldCheck).
  * Configured dynamic password visibility eye icons and alert status icons.

### 4. Authentication and Routing
* **Auth Page Guards (`LoginPage.vue` / `RegisterPage.vue`)**:
  * Added route checks so already-logged-in users cannot access login/register pages.
  * Set up redirect query parameters to return users back to their target pages (like the wishlist) after signing in.
  * Fixed a routing redirect loop on the home catalog page.

### 5. Axios and Error Handling
* **Axios Interceptor (`client/src/api/http.ts`)**:
  * Fixed a bug where credentials errors (e.g., "Invalid email or password") were masked by the token refresh handler.
  * Excluded authentication endpoints from the 401 interceptor loop so errors reach the UI.

### 6. Toast Notifications
* **Toast System (`toast.store.ts` / `BaseToastContainer.vue`)**:
  * Created a Pinia store to handle system notifications.
  * Built a global container to display success, error, and info toast alerts.

### 7. Monorepo and Git Configuration
* **Workspaces Config (`package.json`)**:
  * Set up npm workspaces for client and server directories to manage dependencies from the root.
  * Cleaned up Git configurations to untrack and ignore local environment files.

---

## 📂 Project Monorepo Structure

```
ecommerce-vue/
├── package.json               # Monorepo workspaces definition
├── package-lock.json          # Unified lockfile for client and server dependencies
├── .gitignore                 # Root Git exclusions
├── docs/
│   └── shawky-ahmad-shawky/
│       ├── README.md          # This documentation
│       └── curio_api_collection.postman_collection.json # API Collection for testing
├── client/                    # Vue 3 Frontend (curio-client)
└── server/                    # Express Backend (curio-server)
```
