import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

/**
 * Global centralized error handling middleware.
 * Intercepts all operational and programming errors, formatting them consistently.
 */
export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred';
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let errors = err.errors;

  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] ${req.method} ${req.url} :`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
export default errorMiddleware;
