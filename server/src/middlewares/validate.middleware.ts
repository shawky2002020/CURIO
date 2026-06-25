import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

/**
 * Generic request validation middleware.
 * In production, this integrates with Joi or Zod validation schemas.
 */
export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // TODO: Implement Joi/Zod validation:
    // const { error } = schema.validate(req.body, { abortEarly: false });
    // if (error) {
    //   const errors: Record<string, string[]> = {};
    //   error.details.forEach((detail) => {
    //     const path = detail.path.join('.');
    //     if (!errors[path]) errors[path] = [];
    //     errors[path].push(detail.message);
    //   });
    //   return next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', errors));
    // }
    next();
  };
};
