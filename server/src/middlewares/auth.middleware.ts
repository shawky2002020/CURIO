import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../modules/users/user.model.js';

/**
 * Middleware to protect routes and verify JWT access tokens.
 */
export const auth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required. Please provide a Bearer token.', 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];

  // TODO: Implement JWT verification logic:
  // const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { sub: string; role: string };
  // const user = await User.findById(decoded.sub);
  
  // Placeholder mock for scaffolding:
  // For now, grab the first active user or return unauthorized if database is empty.
  const user = await User.findOne({ status: 'active' });
  if (!user) {
    throw new ApiError(401, 'User not found or account is inactive.', 'UNAUTHORIZED');
  }

  if (user.status === 'blocked') {
    throw new ApiError(403, 'Your account has been blocked.', 'USER_BLOCKED');
  }

  if (user.status === 'deleted') {
    throw new ApiError(403, 'Your account has been deleted.', 'USER_DELETED');
  }

  req.user = user;
  next();
});
