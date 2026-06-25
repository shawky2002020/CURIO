/**
 * Input validation schemas for authentication endpoints.
 * In production, these will use Joi or Zod schemas.
 */
export const registerSchema = {
  // Placeholder structure for Zod / Joi validation schemas
  body: {
    fullName: 'required|string|min:2',
    email: 'optional|email',
    phone: 'optional|string',
    password: 'required|string|min:8',
    role: 'required|enum:customer,seller',
  },
};

export const loginSchema = {
  body: {
    email: 'optional|email',
    phone: 'optional|string',
    password: 'required|string',
  },
};

export const resetPasswordSchema = {
  body: {
    token: 'required|string',
    password: 'required|string|min:8',
  },
};
