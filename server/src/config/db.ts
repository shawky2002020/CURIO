import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Handles database connection to MongoDB via Mongoose.
 */
export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`[Database] MongoDB connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error);
    process.exit(1);
  }
};
