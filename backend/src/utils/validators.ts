import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const verifySchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    code: z.string().length(6, 'Verification code must be exactly 6 digits'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    code: z.string().length(6, 'Reset code must be exactly 6 digits'),
    password: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export const transactionSchema = z.object({
  body: z.object({
    type: z.enum(['income', 'expense', 'transfer']),
    category: z.string().min(1, 'Category is required'),
    amount: z.number().positive('Amount must be a positive number'),
    date: z.string().transform((val) => new Date(val)),
    description: z.string().optional().default(''),
    accountFrom: z.string().optional(),
    accountTo: z.string().optional(),
    isRecurring: z.boolean().optional().default(false),
    recurringFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  }),
});

export const budgetSchema = z.object({
  body: z.object({
    category: z.string().min(1, 'Category is required'),
    limit: z.number().nonnegative('Limit must be a non-negative number'),
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
  }),
});

export const chatSchema = z.object({
  body: z.object({
    query: z.string().min(1, 'Query cannot be empty'),
  }),
});
