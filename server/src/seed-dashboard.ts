import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { Category } from './modules/products/category.model.js';
import { User } from './modules/users/user.model.js';
import { Product } from './modules/products/product.model.js';
import { Order } from './modules/cart/order.model.js';
import { hashPassword } from './utils/hashPassword.js';

const seedDashboardData = async () => {
  try {
    await connectDB();

    console.log('[Seeder] Clearing old collections (Categories, Users, Products, Orders)...');
    await Promise.all([
      Category.deleteMany({}),
      User.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
    ]);

    console.log('[Seeder] Creating categories...');
    const catArt = await Category.create({
      name: 'Curation Art',
      slug: 'curation-art',
      description: 'Collectibles and visual art artifacts.',
    });
    const catPottery = await Category.create({
      name: 'Studio Pottery',
      slug: 'studio-pottery',
      description: 'Hand-thrown clay, ceramics, and stoneware.',
    });

    console.log('[Seeder] Creating users...');
    const passwordHash = await hashPassword('Password123');

    const admin = await User.create({
      fullName: 'Chief Curator',
      email: 'admin@curio.com',
      emailVerified: true,
      passwordHash,
      role: 'admin',
      provider: 'local',
      status: 'active',
    });

    const seller = await User.create({
      fullName: 'Atelier Artisan',
      email: 'seller@curio.com',
      emailVerified: true,
      passwordHash,
      role: 'seller',
      provider: 'local',
      status: 'active',
    });

    const customer = await User.create({
      fullName: 'John Collector',
      email: 'customer@curio.com',
      emailVerified: true,
      passwordHash,
      role: 'customer',
      provider: 'local',
      status: 'active',
    });

    console.log('[Seeder] Creating products...');
    const prodVessel = await Product.create({
      name: 'Bronze Vessel',
      slug: 'bronze-vessel',
      description: 'Sandcast solid bronze ornamental vessel.',
      price: 120.00,
      stock: 5,
      categoryId: catArt._id,
      images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600'],
      seller: seller._id,
      status: 'active',
    });

    const prodVase = await Product.create({
      name: 'Stoneware Vase',
      slug: 'stoneware-vase',
      description: 'Cobalt glazed hand-thrown stoneware.',
      price: 65.00,
      stock: 10,
      categoryId: catPottery._id,
      images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600'],
      seller: seller._id,
      status: 'active',
    });

    const prodLinen = await Product.create({
      name: 'Linen Tablecloth',
      slug: 'linen-tablecloth',
      description: 'Flemish linen table runner.',
      price: 80.00,
      stock: 8,
      categoryId: catArt._id,
      images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600'],
      seller: seller._id,
      status: 'active',
    });

    const prodBowl = await Product.create({
      name: 'Terracotta Bowl',
      slug: 'terracotta-bowl',
      description: 'Rustic terracotta low profile bowl.',
      price: 35.00,
      stock: 15,
      categoryId: catPottery._id,
      images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600'],
      seller: seller._id,
      status: 'active',
    });

    console.log('[Seeder] Creating time-series orders for the last 12 months...');
    
    // Function to calculate a past date by subtracting months
    const getPastDate = (monthsAgo: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() - monthsAgo);
      return d;
    };

    const mockOrders = [
      // 1. July 2025
      {
        userId: customer._id,
        items: [{ productId: prodVessel._id, name: prodVessel.name, price: 120, quantity: 2 }],
        shippingAddress: { fullName: 'John Collector', email: 'customer@curio.com', phone: '+1234', address: '123 Art Way', city: 'London', country: 'UK', postalCode: 'W1' },
        totals: { subtotal: 240, discount: 0, shipping: 0, tax: 0, total: 240 },
        status: 'delivered' as const,
        createdAt: getPastDate(11),
      },
      // 2. August 2025
      {
        userId: customer._id,
        items: [{ productId: prodVase._id, name: prodVase.name, price: 65, quantity: 5 }, { productId: prodBowl._id, name: prodBowl.name, price: 35, quantity: 1 }],
        shippingAddress: { fullName: 'Alice Pottery', email: 'alice@curio.com', phone: '+1234', address: '45 Clay St', city: 'Bristol', country: 'UK', postalCode: 'BS1' },
        totals: { subtotal: 360, discount: 10, shipping: 0, tax: 0, total: 350 },
        status: 'delivered' as const,
        createdAt: getPastDate(10),
      },
      // 3. September 2025
      {
        userId: customer._id,
        items: [{ productId: prodLinen._id, name: prodLinen.name, price: 80, quantity: 1 }],
        shippingAddress: { fullName: 'Bob Runner', email: 'bob@curio.com', phone: '+1234', address: '78 Linen Lane', city: 'Leeds', country: 'UK', postalCode: 'LS1' },
        totals: { subtotal: 80, discount: 0, shipping: 0, tax: 0, total: 80 },
        status: 'delivered' as const,
        createdAt: getPastDate(9),
      },
      // 4. October 2025
      {
        userId: customer._id,
        items: [{ productId: prodVase._id, name: prodVase.name, price: 65, quantity: 2 }, { productId: prodBowl._id, name: prodBowl.name, price: 35, quantity: 1 }],
        shippingAddress: { fullName: 'Charlie Collector', email: 'charlie@curio.com', phone: '+1234', address: '89 Dust Rd', city: 'York', country: 'UK', postalCode: 'YO1' },
        totals: { subtotal: 165, discount: 30, shipping: 0, tax: 0, total: 135 },
        status: 'delivered' as const,
        createdAt: getPastDate(8),
      },
      // 5. November 2025
      {
        userId: customer._id,
        items: [{ productId: prodVessel._id, name: prodVessel.name, price: 120, quantity: 1 }, { productId: prodBowl._id, name: prodBowl.name, price: 35, quantity: 1 }],
        shippingAddress: { fullName: 'Daisy Collector', email: 'daisy@curio.com', phone: '+1234', address: '12 Rose Gardens', city: 'Bath', country: 'UK', postalCode: 'BA1' },
        totals: { subtotal: 155, discount: 0, shipping: 5, tax: 0, total: 160 },
        status: 'delivered' as const,
        createdAt: getPastDate(7),
      },
      // 6. December 2025
      {
        userId: customer._id,
        items: [{ productId: prodLinen._id, name: prodLinen.name, price: 80, quantity: 1 }],
        shippingAddress: { fullName: 'Daisy Collector', email: 'daisy@curio.com', phone: '+1234', address: '12 Rose Gardens', city: 'Bath', country: 'UK', postalCode: 'BA1' },
        totals: { subtotal: 80, discount: 0, shipping: 15, tax: 0, total: 95 },
        status: 'delivered' as const,
        createdAt: getPastDate(6),
      },
      // 7. January 2026
      {
        userId: customer._id,
        items: [{ productId: prodVessel._id, name: prodVessel.name, price: 120, quantity: 1 }, { productId: prodLinen._id, name: prodLinen.name, price: 80, quantity: 1 }, { productId: prodBowl._id, name: prodBowl.name, price: 35, quantity: 1 }],
        shippingAddress: { fullName: 'Ethan Hunt', email: 'ethan@curio.com', phone: '+1234', address: '55 Spy Dr', city: 'London', country: 'UK', postalCode: 'EC1' },
        totals: { subtotal: 235, discount: 15, shipping: 0, tax: 0, total: 220 },
        status: 'delivered' as const,
        createdAt: getPastDate(5),
      },
      // 8. February 2026
      {
        userId: customer._id,
        items: [{ productId: prodLinen._id, name: prodLinen.name, price: 80, quantity: 2 }],
        shippingAddress: { fullName: 'Fiona Gallagher', email: 'fiona@curio.com', phone: '+1234', address: '21 Sham St', city: 'Manchester', country: 'UK', postalCode: 'M1' },
        totals: { subtotal: 160, discount: 10, shipping: 0, tax: 0, total: 150 },
        status: 'delivered' as const,
        createdAt: getPastDate(4),
      },
      // 9. March 2026
      {
        userId: customer._id,
        items: [{ productId: prodVessel._id, name: prodVessel.name, price: 120, quantity: 1 }, { productId: prodLinen._id, name: prodLinen.name, price: 80, quantity: 1 }],
        shippingAddress: { fullName: 'George Costanza', email: 'george@curio.com', phone: '+1234', address: '88 Queens Blvd', city: 'New York', country: 'USA', postalCode: 'NY1001' },
        totals: { subtotal: 200, discount: 0, shipping: 0, tax: 0, total: 200 },
        status: 'delivered' as const,
        createdAt: getPastDate(3),
      },
      // 10. April 2026
      {
        userId: customer._id,
        items: [{ productId: prodVessel._id, name: prodVessel.name, price: 120, quantity: 1 }, { productId: prodVase._id, name: prodVase.name, price: 65, quantity: 1 }],
        shippingAddress: { fullName: 'Hannah Montana', email: 'hannah@curio.com', phone: '+1234', address: '77 Malibu Beach', city: 'Malibu', country: 'USA', postalCode: 'CA9021' },
        totals: { subtotal: 185, discount: 0, shipping: 0, tax: 0, total: 185 },
        status: 'delivered' as const,
        createdAt: getPastDate(2),
      },
      // 11. May 2026
      {
        userId: customer._id,
        items: [{ productId: prodVase._id, name: prodVase.name, price: 65, quantity: 1 }],
        shippingAddress: { fullName: 'Ian Malcolm', email: 'ian@curio.com', phone: '+1234', address: '33 Chaos Rd', city: 'Austin', country: 'USA', postalCode: 'TX78701' },
        totals: { subtotal: 65, discount: 0, shipping: 0, tax: 0, total: 65 },
        status: 'delivered' as const,
        createdAt: getPastDate(1),
      },
      // 12. June 2026 (Delivered)
      {
        userId: customer._id,
        items: [{ productId: prodVessel._id, name: prodVessel.name, price: 120, quantity: 1 }],
        shippingAddress: { fullName: 'John Collector', email: 'customer@curio.com', phone: '+1234', address: '123 Art Way', city: 'London', country: 'UK', postalCode: 'W1' },
        totals: { subtotal: 120, discount: 0, shipping: 0, tax: 0, total: 120 },
        status: 'delivered' as const,
        createdAt: getPastDate(0),
      },
      // 13. June 2026 (Cancelled - should be excluded from stats totals / charts sales totals)
      {
        userId: customer._id,
        items: [{ productId: prodLinen._id, name: prodLinen.name, price: 80, quantity: 1 }],
        shippingAddress: { fullName: 'John Collector', email: 'customer@curio.com', phone: '+1234', address: '123 Art Way', city: 'London', country: 'UK', postalCode: 'W1' },
        totals: { subtotal: 80, discount: 0, shipping: 19, tax: 0, total: 99 },
        status: 'cancelled' as const,
        createdAt: getPastDate(0),
      },
      // 14. June 2026 (Pending - should be counted in order count and order tables but status is pending)
      {
        userId: customer._id,
        items: [{ productId: prodVessel._id, name: prodVessel.name, price: 120, quantity: 1 }],
        shippingAddress: { fullName: 'Kate Winslet', email: 'kate@curio.com', phone: '+1234', address: '99 Titanic St', city: 'Southampton', country: 'UK', postalCode: 'SO1' },
        totals: { subtotal: 120, discount: 0, shipping: 0, tax: 0, total: 120 },
        status: 'pending' as const,
        createdAt: getPastDate(0),
      },
    ];

    for (const orderData of mockOrders) {
      await Order.create(orderData);
    }

    console.log('[Seeder] Successfully seeded mock orders across the last 12 months.');
    console.log('[Seeder] All dashboard mock data seeded successfully!');

  } catch (error) {
    console.error('[Seeder] Error seeding dashboard mock data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('[Seeder] Database connection closed.');
  }
};

seedDashboardData();
