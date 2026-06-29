import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import wishlistRoutes from './modules/wishlist/wishlist.routes.js';
import productRoutes from './modules/products/product.routes.js';
import categoryRoutes from './modules/products/category.routes.js';
import { cartRouter, checkoutRouter, orderRouter } from './modules/cart/cart.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import bannerRoutes from './modules/banners/banner.routes.js';

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/orders', orderRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Centralized Error Handling Middleware
app.use(errorMiddleware);

export default app;
export { app };
