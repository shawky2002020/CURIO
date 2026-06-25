import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { rateLimiter } from '../../middlewares/rateLimit.middleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';

const router = Router();

// Apply strict rate limiting to sensitive routes
const authRateLimit = rateLimiter(5, 15); // 5 requests per 15 mins

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);
router.post('/google', authRateLimit, authController.googleLogin);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Placeholders for remaining endpoints defined in the documentation
router.get('/verify-email', (req, res) => {
  res.status(200).json({ success: true, message: 'Email verified placeholder.' });
});
router.post('/resend-verification', authRateLimit, (req, res) => {
  res.status(200).json({ success: true, message: 'Verification email resent placeholder.' });
});
router.post('/forgot-password', authRateLimit, (req, res) => {
  res.status(200).json({ success: true, message: 'Password reset link sent placeholder.' });
});
router.post('/reset-password', (req, res) => {
  res.status(200).json({ success: true, message: 'Password reset successful placeholder.' });
});
router.post('/change-password', (req, res) => {
  res.status(200).json({ success: true, message: 'Password changed successful placeholder.' });
});
router.post('/phone/request-otp', authRateLimit, (req, res) => {
  res.status(200).json({ success: true, message: 'OTP SMS requested placeholder.' });
});
router.post('/phone/verify-otp', (req, res) => {
  res.status(200).json({ success: true, message: 'OTP verified placeholder.' });
});

export default router;
