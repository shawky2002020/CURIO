import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

/**
 * Role-based authorization middleware.
 * Must be used AFTER the `auth` middleware to ensure `req.user` is populated.
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.', 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, 'Access denied. Insufficient permissions.', 'FORBIDDEN');
    }

    next();
  };
};
