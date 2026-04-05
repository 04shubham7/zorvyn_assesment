import express, { Express } from 'express';
import apiRoutes from './api/routes/index';
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.use('/api/v1', apiRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
}
