import rateLimit from 'express-rate-limit';

// Limiter for authentication routes (login, register, forgot-password, reset-password)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === 'production' ? 20 : 10000, // Relaxed limits for local development testing
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Limiter for standard application routes
export const apiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 150, // Limit each IP to 150 requests per windowMs
  message: {
    message: 'Too many API requests. Please slow down and try again later.',
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
