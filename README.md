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

### Backend (Server)
* **Runtime & Framework**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) (TypeScript)
* **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/)
* **Authentication**: JWT Access & Refresh Tokens (with Token Rotation and Session Revocation)
* **Third-Party Auth**: Google OAuth 2.0 (Identity Services integration)
* **Email System**: SMTP email client via [Nodemailer](https://nodemailer.com/) (supporting connection pooling and secure delivery)

---

## 👥 Team Module Registry & Tech Ownership

Each core module of the CURIO platform is assigned to a specific team member who owns both the backend API services and the corresponding frontend interfaces.

| Team Member | Module & Responsibilities | Tech Ownership & Documentation |
| :--- | :--- | :--- |
| **Shawky Ahmad Shawky** | **Authentication & Users**<br>• User Registration & Login (Email, Phone, Google OAuth)<br>• SMTP Email Verification<br>• User Profile Management<br>• Multi-user Roles (Customer, Seller, Admin)<br>• Wishlist & Favorites | **Authentication APIs + User UI**<br>👉 [Detailed Documentation](docs/shawky-ahmad-shawky/README.md) |
| **Member 2** | **Product Catalog**<br>• Categories Management<br>• Product Listings & Stock Availability<br>• Live Catalog Search & Filtering<br>• Reviews & Ratings | **Product APIs + Product Pages** |
| **Moamen Alaa Soltan** | **Cart & Checkout**<br>• Shopping Cart (Add/Remove/Adjust)<br>• Order Summary & Price Breakdown<br>• Guest Checkout & Promo Codes | **Cart APIs + Checkout UI**<br> 👉 [Detailed Documentation](docs/Moamen%20Alaa%20Soltan/README.md)
| **Hassan Muhammad** | **Orders & Payments**<br>• Order Placement & Status Tracking<br>• Email Notifications & History<br>• Payment Integration (Stripe/PayPal) | **Orders APIs + Payment Gateway** |
| **Member 5** | **Admin & Seller Dashboard**<br>• Admin Panel & User Management<br>• Inventory & Product Management<br>• Seller Registration & Earnings Payout | **Admin Dashboard + Seller Dashboard** |

---

## 📂 Monorepo Architecture

The repository is organized as an npm workspaces monorepo, enabling unified dependency hoisting and package linking:

```
ecommerce-vue/
├── package.json               # Monorepo workspaces & dependency definitions
├── package-lock.json          # Unified lockfile for client and server dependencies
├── .gitignore                 # Root Git exclusion rules
├── docs/
│   └── shawky-ahmad-shawky/
│       ├── README.md          # Shawky's contribution registry
│       └── curio_api_collection.postman_collection.json # API Collection for testing
├── client/                    # Vue 3 Frontend SPA (curio-client)
└── server/                    # Node.js Express API (curio-server)
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a remote MongoDB Atlas URI)

### 2. Dependency Installation
Run the following command at the root of the repository to install and link all client and server dependencies:
```bash
npm install
```

### 3. Environment Configurations

#### Backend (`server/.env`)
Create a `.env` file inside the `server/` directory and configure the following:
```ini
# Server Settings
NODE_ENV=development
PORT=5000

# Database Connection
MONGODB_URI=mongodb://localhost:27017/ecommerce_app

# JWT Encryption Keys
JWT_ACCESS_SECRET=your_super_secure_access_secret_key_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Client Origin
CLIENT_URL=http://localhost:5173

# Production SMTP Mail Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_username@gmail.com
EMAIL_PASS=your_smtp_app_password
EMAIL_FROM=your_smtp_username@gmail.com

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
