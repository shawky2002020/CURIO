import { env } from './env.js';

/**
 * CORS (Cross-Origin Resource Sharing) configuration options.
 */
export const corsOptions = {
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
