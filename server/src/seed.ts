import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './modules/users/user.model.js';
import { Category } from './modules/products/category.model.js';
import { Product } from './modules/products/product.model.js';
import { PromoCode } from './modules/cart/promo.model.js';
import { hashPassword } from './utils/hashPassword.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seeder] Database connected successfully.');

    // Clear existing data
    console.log('[Seeder] Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await PromoCode.deleteMany({});

    // 1. Seed Users
    console.log('[Seeder] Seeding users...');
    const defaultPassword = 'Password123!';
    const passwordHash = await hashPassword(defaultPassword);

    const users = await User.insertMany([
      {
        fullName: 'Admin User',
        email: 'admin@curio.com',
        emailVerified: true,
        phone: '+10000000000',
        phoneVerified: true,
        passwordHash,
        role: 'admin',
        provider: 'local',
        status: 'active',
      },
      {
        fullName: 'Seller User',
        email: 'seller@curio.com',
        emailVerified: true,
        phone: '+10000000001',
        phoneVerified: true,
        passwordHash,
        role: 'seller',
        provider: 'local',
        status: 'active',
      },
      {
        fullName: 'Buyer User',
        email: 'buyer@curio.com',
        emailVerified: true,
        phone: '+10000000002',
        phoneVerified: true,
        passwordHash,
        role: 'customer',
        provider: 'local',
        status: 'active',
      },
    ]);

    const sellerId = users.find(u => u.role === 'seller')?._id;

    // 2. Seed Categories
    console.log('[Seeder] Seeding categories...');
    const categories = await Category.insertMany([
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Latest gadgets and electronic devices.',
      },
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Apparel and fashion accessories.',
      },
    ]);

    // 3. Seed Products
    console.log('[Seeder] Seeding products...');
    await Product.insertMany([
      {
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'High quality noise-canceling wireless headphones.',
        price: 199.99,
        stock: 50,
        categoryId: categories[0]._id,
        seller: sellerId,
        status: 'active',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600'],
      },
      {
        name: 'Smart Watch',
        slug: 'smart-watch',
        description: 'Feature-rich smartwatch with health tracking.',
        price: 299.99,
        stock: 30,
        categoryId: categories[0]._id,
        seller: sellerId,
        status: 'active',
        images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=600'],
      },
      {
        name: 'Cotton T-Shirt',
        slug: 'cotton-t-shirt',
        description: 'Comfortable 100% cotton t-shirt.',
        price: 19.99,
        stock: 100,
        categoryId: categories[1]._id,
        seller: sellerId,
        status: 'active',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600'],
      },
    ]);

    // 4. Seed Promos
    console.log('[Seeder] Seeding promo codes...');
    await PromoCode.insertMany([
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        isActive: true,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    ]);

    console.log('[Seeder] Database seeded successfully.');
  } catch (error) {
    console.error('[Seeder] Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('[Seeder] Database connection closed.');
  }
};

seedDatabase();
