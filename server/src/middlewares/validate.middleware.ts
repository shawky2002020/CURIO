import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

/**
 * Lightweight Custom Request Validation Middleware.
 * Parses validation schemas and checks req.body against constraints.
 */
export const validate = (schema: { body?: Record<string, string>; query?: Record<string, string>; params?: Record<string, string> }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string[]> = {};

    // Validate request body if schema provides it
    if (schema.body) {
      for (const [key, rules] of Object.entries(schema.body)) {
        // Resolve nested path values (e.g. storeAddress.street)
        let parentValue: any = req.body;
        const parts = key.split('.');
        for (let i = 0; i < parts.length - 1; i++) {
          parentValue = parentValue ? parentValue[parts[i]] : undefined;
        }

        // If parent object is missing (e.g., optional parent is not provided), skip validation
        if (parts.length > 1 && (parentValue === undefined || parentValue === null)) {
          continue;
        }

        let value: any = req.body;
        for (const part of parts) {
          value = value ? value[part] : undefined;
        }

        const ruleList = rules.split('|');

        const isRequired = ruleList.includes('required');
        const isOptional = ruleList.includes('optional');

        if (isRequired && (value === undefined || value === null || value === '')) {
          if (!errors[key]) errors[key] = [];
          errors[key].push(`${key} is required.`);
          continue;
        }

        if (isOptional && (value === undefined || value === null || value === '')) {
          continue;
        }


        // Run validation assertions
        for (const rule of ruleList) {
          if (rule.startsWith('min:')) {
            const minLength = parseInt(rule.split(':')[1], 10);
            if (typeof value === 'string' && value.length < minLength) {
              if (!errors[key]) errors[key] = [];
              errors[key].push(`${key} must be at least ${minLength} characters.`);
            }
          }
          if (rule === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (typeof value === 'string' && !emailRegex.test(value)) {
              if (!errors[key]) errors[key] = [];
              errors[key].push(`${key} must be a valid email address.`);
            }
          }
          if (rule.startsWith('enum:')) {
            const allowed = rule.split(':')[1].split(',');
            if (!allowed.includes(value)) {
              if (!errors[key]) errors[key] = [];
              errors[key].push(`${key} must be one of: ${allowed.join(', ')}.`);
            }
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return next(new ApiError(400, 'Request validation failed.', 'VALIDATION_ERROR', errors));
    }

    next();
  };
};
export default validate;
