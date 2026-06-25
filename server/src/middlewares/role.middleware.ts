import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { UserRole } from '../types/auth.types.js';

/**
 * Middleware to restrict route access to specific user roles.
 * Must be used after the 'auth' middleware.
 */
export const role = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.', 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'Access denied. You do not have permission to access this resource.', 'FORBIDDEN')
      );
    }

    next();
  };
};
