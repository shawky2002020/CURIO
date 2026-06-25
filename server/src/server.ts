import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  // 1. Connect to Database
  await connectDB();

  // 2. Start Express Server
  const server = app.listen(env.PORT, () => {
    console.log(`[Server] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: any) => {
    console.error(`[Process] Unhandled Rejection: ${err.message || err}`);
    server.close(() => process.exit(1));
  });
};

startServer();
