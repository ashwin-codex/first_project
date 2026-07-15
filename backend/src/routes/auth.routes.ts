import { Router } from 'express';
import {
  register,
  login,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  verifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validators';

const router = Router();

router.post('/register', authRateLimiter, validateRequest(registerSchema), register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), login);
router.post('/verify-email', authRateLimiter, validateRequest(verifySchema), verifyEmail);
router.post('/resend-code', authRateLimiter, resendVerificationCode);
router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema), resetPassword);

export default router;
