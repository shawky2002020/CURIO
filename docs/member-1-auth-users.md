# Member 1 — Authentication & Users Module

This document provides the complete architectural design, API specifications, database models, security requirements, and frontend/backend integration points for the **Authentication & Users** module (owned by Member 1).

---

## 1. Overview
The Authentication & Users module forms the foundation of the e-commerce application. It manages user identity, session security, multi-role authorization (Customer, Seller, Admin), profile management, and personalized user states (Wishlist & Favorites). This module ensures that all other services can securely identify who is making a request and what actions they are permitted to perform.

---

## 2. Scope of Ownership
As Member 1, the scope of ownership includes:
* **User Identity & Lifecycle**: From registration, email/phone verification, password recovery, to profile updates and account deletion (soft-delete).
* **Authentication Mechanics**: Support for email/password credentials, phone OTP, and Google OAuth 2.0.
* **Session Management**: Secure JWT token issuance, refresh token rotation, and logout.
* **Authorization & RBAC**: Defining and enforcing user roles (`customer`, `seller`, `admin`) using route guards (frontend) and middleware (backend).
* **Personalization**: Managing the user's wishlist and favorites.
* **Shared Auth State**: Providing a global Pinia store for reactive access to the authenticated user's state.

---

## 3. Responsibilities
* Implement secure backend REST APIs for authentication, profile management, and wishlist operations.
* Design and implement MongoDB models using Mongoose with strict schema validation.
* Build the frontend UI components and pages using Vue 3, TypeScript, and Tailwind/Vanilla CSS.
* Set up global Pinia stores and Vue Router guards to protect sensitive routes.
* Ensure high security by implementing password hashing, rate limiting, and input validation on both client and server.

---

## 4. Features

### Registration
* Public registration endpoint for `customer` and `seller` roles.
* Validation of password strength, unique email, and phone format.
* Automated trigger for email verification upon registration.
* Prevention of direct `admin` registration.

### Login
* Credentials-based login (Email/Password).
* Generation of short-lived JWT Access Tokens and long-lived Refresh Tokens.
* Automatic updates of `lastLoginAt` timestamps.

### Google OAuth
* One-click authentication using Google Sign-In.
* Account association: if a user registers with Google using an email that already exists, safe linking occurs (subject to security policy).
* Backend validation of Google ID tokens.

### Email Verification
* Verification link sent via email containing a secure, short-lived verification token.
* Verification status tracking (`emailVerified: boolean`).
* Endpoint to resend verification emails with rate limiting.

### Phone Verification / OTP
* Requesting OTP via SMS for phone verification or login.
* Verifying OTP and updating `phoneVerified: boolean` status.

### Forgot Password
* Requesting password reset links via email.
* Generation of secure, single-use, timed reset tokens.

### Reset Password
* Consuming the reset token to set a new password.
* Invalidation of all active sessions/tokens for the user upon password change.

### Change Password
* Authenticated endpoint to update password by providing the current password and a new password.

### Profile Management
* Viewing own profile details.
* Editing profile details (fullName, phone, avatar).
* Uploading avatar images securely to cloud storage.
* Account deletion (soft-delete, marking status as `deleted` and anonymizing personal identifiers).

### User Roles
* Hierarchical or role-based access control:
  * **Customer**: Can view products, manage wishlist, place orders, write reviews.
  * **Seller**: Can manage their own products, view sales reports, update order status for their products.
  * **Admin**: Has full access to user management, system configurations, and platform-wide reports.

### Wishlist and Favorites
* Adding/removing products to/from a personalized wishlist.
* Retrieving the wishlist containing reference product IDs.
* Bulk cleaning or deleting wishlist items.

---

## 5. Backend Folder Structure
The backend follows a clean, modular architecture inside the `server/` directory:

```txt
server/
├── src/
│   ├── app.ts                  # Express application setup
│   ├── server.ts               # Server entrypoint (DB connection & listen)
│   │
│   ├── config/
│   │   ├── db.ts               # Mongoose connection
│   │   ├── env.ts              # Strongly typed env validation
│   │   ├── cors.ts             # CORS configuration
│   │   └── passport.ts         # Passport.js OAuth configurations
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts      # Authentication routes
│   │   │   ├── auth.controller.ts  # Route handlers
│   │   │   ├── auth.service.ts     # Auth business logic (JWT, OTP, Login)
│   │   │   ├── auth.validation.ts  # Joi/Zod validation schemas
│   │   │   ├── auth.types.ts       # Module specific TS types
│   │   │   └── auth.constants.ts   # Error codes, token durations
│   │   │
│   │   ├── users/
│   │   │   ├── user.model.ts       # Mongoose User Schema & Model
│   │   │   ├── user.routes.ts      # Profile / User management routes
│   │   │   ├── user.controller.ts  # Route handlers
│   │   │   ├── user.service.ts     # Profile and query logic
│   │   │   ├── user.validation.ts  # Input validations
│   │   │   └── user.types.ts       # User specific TS types
│   │   │
│   │   ├── wishlist/
│   │   │   ├── wishlist.model.ts   # Mongoose Wishlist Schema
│   │   │   ├── wishlist.routes.ts  # Wishlist routes
│   │   │   ├── wishlist.controller.ts
│   │   │   ├── wishlist.service.ts
│   │   │   ├── wishlist.validation.ts
│   │   │   └── wishlist.types.ts
│   │   │
│   │   └── tokens/
│   │       ├── token.model.ts      # Mongoose Token Schema (refresh/reset)
│   │       ├── token.service.ts    # Token generation, hashing & verification
│   │       ├── token.types.ts
│   │       └── token.constants.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts       # JWT validation & req.user injection
│   │   ├── role.middleware.ts       # Role-based check (RBAC)
│   │   ├── validate.middleware.ts   # Joi/Zod request validator
│   │   ├── error.middleware.ts      # Global centralized error handler
│   │   ├── rateLimit.middleware.ts  # Rate limiting (express-rate-limit)
│   │   └── upload.middleware.ts     # File upload (Multer)
│   │
│   ├── services/
│   │   ├── email.service.ts         # Nodemailer / SendGrid wrapper
│   │   ├── googleOAuth.service.ts   # Google OAuth verification
│   │   ├── otp.service.ts           # Twilio / SMS provider wrapper
│   │   └── storage.service.ts       # Cloudinary / S3 helper
│   │
│   ├── types/
│   │   ├── api.types.ts            # Common API Response types
│   │   ├── auth.types.ts           # Global auth-related types
│   │   ├── express.d.ts            # Express Request namespace extension
│   │   └── roles.types.ts          # Role definitions
│   │
│   ├── utils/
│   │   ├── ApiError.ts             # Custom Operational Error class
│   │   ├── asyncHandler.ts         # Catching async errors in routes
│   │   ├── generateToken.ts        # Helper to generate JWTs
│   │   ├── hashPassword.ts         # Bcrypt helpers
│   │   └── sanitizeUser.ts         # Strip sensitive data from User object
│   │
│   └── tests/
│       ├── auth.test.ts
│       ├── user.test.ts
│       └── wishlist.test.ts
│
├── .env.example
├── tsconfig.json
└── README.md
```

---

## 6. Frontend Folder Structure
The frontend is built with Vue 3 and TypeScript inside the `client/` directory:

```txt
client/
├── src/
│   ├── main.ts                 # Vue application initialization
│   ├── App.vue                 # Root component
│   │
│   ├── router/
│   │   ├── index.ts            # Router setup and page routes
│   │   └── guards.ts           # Auth, Guest, and Role navigation guards
│   │
│   ├── api/
│   │   ├── http.ts             # Axios instance with interceptors for JWT
│   │   ├── auth.api.ts         # Auth API requests
│   │   ├── user.api.ts         # User Profile API requests
│   │   └── wishlist.api.ts     # Wishlist API requests
│   │
│   ├── stores/
│   │   ├── auth.store.ts       # Shared auth state (tokens, current user)
│   │   ├── user.store.ts       # Profile state
│   │   └── wishlist.store.ts   # Wishlist state (cached products)
│   │
│   ├── types/
│   │   ├── api.types.ts        # Frontend API response interfaces
│   │   ├── auth.types.ts       # Login/Register payload interfaces
│   │   ├── user.types.ts       # User profile interfaces
│   │   └── wishlist.types.ts   # Wishlist interfaces
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.vue           # Login view
│   │   │   │   ├── RegisterPage.vue        # Register view
│   │   │   │   ├── VerifyEmailPage.vue     # Email verification landing
│   │   │   │   ├── ForgotPasswordPage.vue  # Password reset request page
│   │   │   │   └── ResetPasswordPage.vue   # Password reset submission page
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.vue
│   │   │   │   ├── RegisterForm.vue
│   │   │   │   ├── GoogleLoginButton.vue
│   │   │   │   └── AuthCard.vue
│   │   │   │
│   │   │   └── auth.routes.ts              # Auth-specific routes
│   │   │
│   │   ├── profile/
│   │   │   ├── pages/
│   │   │   │   ├── ProfilePage.vue         # Profile details page
│   │   │   │   └── EditProfilePage.vue     # Edit profile form page
│   │   │   │
│   │   │   └── components/
│   │   │       ├── ProfileForm.vue
│   │   │       └── AvatarUploader.vue
│   │   │
│   │   └── wishlist/
│   │       ├── pages/
│   │       │   └── WishlistPage.vue        # Wishlist products list
│   │       │
│   │       └── components/
│   │           ├── WishlistButton.vue      # Add to wishlist button
│   │           └── WishlistEmptyState.vue  # Empty state component
│   │
│   ├── layouts/
│   │   ├── AuthLayout.vue      # Layout with background for auth forms
│   │   └── MainLayout.vue      # Main application header/footer layout
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── BaseButton.vue  # Reusable premium button
│   │   │   ├── BaseInput.vue   # Form input with validation styling
│   │   │   ├── BaseAlert.vue   # Beautiful alert banner
│   │   │   └── BaseLoader.vue  # Premium loading spinner
│   │   │
│   │   └── shared/
│   │       └── UserAvatar.vue  # Reusable avatar image component
│   │
│   └── utils/
│       ├── tokenStorage.ts     # LocalStorage / Cookie token manager
│       ├── validation.ts       # Frontend validation rules
│       └── errorHandler.ts     # Global client error parser
│
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 7. MongoDB / NoSQL Models

### User Model (`IUser`)
This schema represents the central user account document.

```typescript
import { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email?: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  passwordHash?: string;
  avatarUrl?: string;
  role: 'customer' | 'seller' | 'admin';
  provider: 'local' | 'google';
  googleId?: string;
  status: 'active' | 'blocked' | 'deleted';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

* **Indexing**: Unique sparse index on `email` and `phone`. Unique sparse index on `googleId`.

### Token Model (`IToken`)
Stores secure tokens used for OAuth refreshes, password resets, and verification processes.

```typescript
export interface IToken extends Document {
  userId: Schema.Types.ObjectId;
  type: 'refresh' | 'email_verification' | 'password_reset' | 'phone_otp';
  tokenHash: string; // Stored as a cryptographic hash
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}
```

* **TTL Indexing**: A TTL index on `expiresAt` automatically deletes expired tokens from the database.

### Wishlist Model (`IWishlist`)
Links a customer to their selected products.

```typescript
export interface IWishlist extends Document {
  userId: Schema.Types.ObjectId;
  items: Array<{
    productId: Schema.Types.ObjectId; // Reference to product in catalog
    addedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 8. TypeScript Types and Interfaces

These definitions are shared across files to maintain rigid type-safety.

```typescript
export type UserRole = 'customer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'blocked' | 'deleted';
export type AuthProvider = 'local' | 'google';

export interface User {
  id: string;
  fullName: string;
  email?: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  avatarUrl?: string;
  role: UserRole;
  provider: AuthProvider;
  status: UserStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}
```

---

## 9. Full API Endpoints

### Auth Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new customer or seller | Public |
| `POST` | `/api/auth/login` | Log in with email & password | Public |
| `POST` | `/api/auth/google` | Verify Google credential token & log in / register | Public |
| `POST` | `/api/auth/refresh` | Rotate JWT access and refresh tokens | Public (Cookie/Payload) |
| `POST` | `/api/auth/logout` | Revoke active refresh token and clear cookies | Public/Auth |
| `GET` | `/api/auth/verify-email?token=`| Verify email using token from link | Public |
| `POST` | `/api/auth/resend-verification`| Resend verification email to user | Public (Rate-limited) |
| `POST` | `/api/auth/forgot-password` | Send password reset link to email | Public (Rate-limited) |
| `POST` | `/api/auth/reset-password` | Set new password using reset token | Public |
| `POST` | `/api/auth/change-password` | Update password while logged in | Authenticated |
| `POST` | `/api/auth/phone/request-otp` | Trigger SMS OTP to phone | Public/Auth |
| `POST` | `/api/auth/phone/verify-otp` | Validate SMS OTP | Public/Auth |

### User Profile Endpoints (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/me` | Retrieve the authenticated user's profile | Authenticated |
| `PATCH` | `/api/users/me` | Update profile data (fullName, phone, avatar) | Authenticated |
| `DELETE` | `/api/users/me` | Soft-delete own user account | Authenticated |

### Wishlist Endpoints (`/api/wishlist`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/wishlist` | Retrieve the active user's wishlist | Authenticated (Customer) |
| `POST` | `/api/wishlist/:productId` | Add a product to the wishlist | Authenticated (Customer) |
| `DELETE`| `/api/wishlist/:productId` | Remove a product from the wishlist | Authenticated (Customer) |
| `DELETE`| `/api/wishlist` | Clear all items from the wishlist | Authenticated (Customer) |

---

## 10. Request and Response Examples

### 1. Register User (`POST /api/auth/register`)
**Request Body**:
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPassword123!",
  "role": "customer"
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "60d5ecb863a6c22c5c8b4567",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "emailVerified": false,
      "phoneVerified": false,
      "role": "customer",
      "provider": "local",
      "status": "active",
      "createdAt": "2026-06-25T14:30:00.000Z",
      "updatedAt": "2026-06-25T14:30:00.000Z"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### 2. Add to Wishlist (`POST /api/wishlist/:productId`)
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product added to wishlist",
  "data": {
    "userId": "60d5ecb863a6c22c5c8b4567",
    "items": [
      {
        "productId": "60d5ecb863a6c22c5c8b4999",
        "addedAt": "2026-06-25T14:35:00.000Z"
      }
    ]
  }
}
```

---

## 11. Middleware

### Auth Middleware (`auth.middleware.ts`)
* Extracts the Bearer token from the `Authorization` header.
* Verifies the token using `JWT_ACCESS_SECRET`.
* Fetches the user from the database. If user is blocked or deleted, rejects immediately.
* Binds the user object to `req.user`.

### Role Middleware (`role.middleware.ts`)
* A curried function that checks if `req.user.role` matches the permitted roles for a route.
* Example usage: `router.post('/products', auth, role('seller', 'admin'), createProduct)`.

### Validation Middleware (`validate.middleware.ts`)
* Validates request bodies, query params, or route params against Joi or Zod schemas.
* Returns a structured `400 Bad Request` with field-specific errors if validation fails.

### Error Middleware (`error.middleware.ts`)
* Catches all unhandled or operational errors.
* Formats error responses to match the global API design (using the `ApiError` utility class).

### Rate Limit Middleware (`rateLimit.middleware.ts`)
* Limits requests from a single IP to prevent brute-force attacks.
* Applied strictly to `/api/auth/login`, `/forgot-password`, `/resend-verification`, and `/phone/request-otp`.

---

## 12. Frontend Pages

* **Login (`LoginPage.vue`)**: Email/Password credentials form with validation + Google Sign-In button. Redirects to previous page or dashboard.
* **Register (`RegisterPage.vue`)**: Full form supporting customer or seller choice, validation checks, and automatic onboarding flow.
* **Verify Email (`VerifyEmailPage.vue`)**: Landing page that extracts the token from URL queries, sends a verification request to the backend, and displays feedback (success/error).
* **Forgot Password (`ForgotPasswordPage.vue`)**: Clean interface requesting email to dispatch recovery instructions.
* **Reset Password (`ResetPasswordPage.vue`)**: Secure entry for new password using token from email link.
* **Profile (`ProfilePage.vue`)**: Visual profile card detailing user info, role badges, verification states, and recent activity.
* **Edit Profile (`EditProfilePage.vue`)**: Form to update name, phone, and upload avatars.
* **Wishlist (`WishlistPage.vue`)**: Displays items in the user's wishlist, letting them add them to the cart or remove them.

---

## 13. Pinia Stores

### Auth Store (`auth.store.ts`)
* **State**: `user: User | null`, `accessToken: string | null`, `isAuthenticated: boolean`, `loading: boolean`.
* **Actions**: `login(credentials)`, `register(payload)`, `loginWithGoogle(token)`, `logout()`, `refreshTokens()`, `initAuth()`.
* Handles token storage management and automatic token refreshes in the background.

### User Store (`user.store.ts`)
* **State**: `profile: User | null`, `loading: boolean`, `error: string | null`.
* **Actions**: `fetchProfile()`, `updateProfile(data)`, `uploadAvatar(file)`, `deleteAccount()`.

### Wishlist Store (`wishlist.store.ts`)
* **State**: `items: WishlistItem[]`, `loading: boolean`.
* **Actions**: `fetchWishlist()`, `addToWishlist(productId)`, `removeFromWishlist(productId)`, `clearWishlist()`.

---

## 14. Vue Router Guards

### Guest Guard
* Restricts access to login/register/forgot-password pages for users who are already logged in.
* Redirects authenticated users back to the home page or dashboard.

### Auth Guard
* Protects routes requiring authentication (profile, wishlist, checkout).
* Redirects unauthenticated guests to `/login`.

### Role Guard
* Enforces role-based navigation.
* Restricts access to `/admin/*` routes to administrators and `/seller/*` routes to sellers. Redirects unauthorized users to a `403 Forbidden` page.

---

## 15. Security Rules

* **Password Hashing**: Cryptographically hash all passwords with `bcrypt` (salt rounds: 12) before persistence.
* **JWT Access Tokens**: Access tokens must be short-lived (15 minutes) and containing only non-sensitive payloads (id, role, status).
* **Refresh Token Rotation**: Issued refresh tokens must be rotated (invalidated and re-issued) upon use to prevent replay attacks. Store a SHA-256 hash of the active refresh token in the database.
* **Secure Token Storage**:
  * Store the access token in frontend memory.
  * Store the refresh token in a secure, `httpOnly`, `secure`, `sameSite: 'Strict'` cookie to prevent XSS extraction.
* **Rate Limiting**: Apply strict rate limiting (e.g., 5 requests per 15 minutes) to auth endpoints to mitigate brute force.
* **Input Validation**: Sanitization and validation of all inputs on both the frontend (reactive validation) and backend (schema validation) to prevent SQL/NoSQL injection and XSS.
* **Registration Controls**: Never expose administrative registration directly. Admins must be promoted via database operations or by existing admins.
* **Soft-Deletes**: Mark deleted users with `status: 'deleted'` to preserve transactional histories while adhering to privacy policies.

---

## 16. Environment Variables

### Backend `.env.example`
```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://localhost:27017/ecommerce_app

JWT_ACCESS_SECRET=replace_me_with_a_long_random_string_for_access_secret
JWT_REFRESH_SECRET=replace_me_with_a_long_random_string_for_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=replace_me
EMAIL_PASS=replace_me
EMAIL_FROM=no-reply@example.com

GOOGLE_CLIENT_ID=replace_me
GOOGLE_CLIENT_SECRET=replace_me

OTP_PROVIDER_API_KEY=replace_me
```

### Frontend `.env.example`
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=replace_me
```

---

## 17. Integration With Other Members

* **Product Catalog Member (Member 2)**:
  * Wishlist page needs to retrieve product details using the product IDs stored in our database.
  * Wishlist button component accepts a `productId` and updates the state in `wishlist.store.ts`.
* **Cart and Checkout Member (Member 3)**:
  * Allows moving items from the Wishlist directly into the active Cart.
  * Cart and Checkout endpoints must verify the active customer's role and authorization using the JWT validated by our middleware.
* **Orders and Payments Member (Member 4)**:
  * Requires our authentication middleware to secure purchase routes and identify the buyer.
* **Admin and Seller Dashboard Member (Member 5)**:
  * Relies on our role middleware and routes to authenticate admin/seller views.
  * Admin dashboards will query our user endpoints to list, block, or manage user accounts.

---

## 18. MVP Checklist
* [ ] Initialize backend folder structures, `tsconfig.json`, and `.env.example` configurations.
* [ ] Construct Mongoose schemas for `User`, `Token`, and `Wishlist`.
* [ ] Create security utility functions (hashing, JWT generation, user sanitization).
* [ ] Build basic Auth Controllers (Register, Login, Logout, Refresh).
* [ ] Integrate JWT verification and Role authorization middlewares.
* [ ] Implement Email verification and Forgot/Reset password flows.
* [ ] Setup Vue Router, router guards, and Pinia stores (Auth, User, Wishlist).
* [ ] Scaffold frontend views (Login, Register, Profile, Wishlist) and UI components.
* [ ] Verify end-to-end integration and run tests.

---

## 19. Recommended Build Order
1. **Phase 1: Foundations**: Set up backend config, environments, schemas, and utility functions.
2. **Phase 2: Core Backend Auth**: Implement register, login, JWT middleware, rate limits, and security controls.
3. **Phase 3: Extended Backend Services**: Integrate Email sender, OTP SMS, and Google OAuth services.
4. **Phase 4: Profile & Wishlist APIs**: Build user profile updating/deletion and wishlist management endpoints.
5. **Phase 5: Frontend Architecture**: Setup Pinia stores, Axios HTTP clients, and Vue Router guards.
6. **Phase 6: Frontend Pages**: Build forms (login, register), profile management pages, and the wishlist view.
7. **Phase 7: Review & Testing**: Conduct unit tests, mock OAuth tests, and security reviews.

---

## 20. Final Deliverables
* Complete functional REST API for all user and auth routes.
* Secure token-based session system with Cookie-based refresh rotation.
* High-fidelity, responsive frontend application with robust route protection.
* Secure Mongo database configuration with structural validations.
* Comprehensive unit and integration test suite.
