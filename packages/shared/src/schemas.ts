import { z } from 'zod';
import {
  MAX_CHECKOUT_LINES,
  MAX_QUANTITY,
  MAX_SEARCH_LENGTH,
} from './constants.js';

export const productsQuerySchema = z.object({
  search: z.string().trim().max(MAX_SEARCH_LENGTH).optional(),
});

export const checkoutItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
});

// Unknown keys (e.g. client-supplied prices or totals) are stripped, never trusted.
export const checkoutRequestSchema = z.object({
  items: z
    .array(checkoutItemSchema)
    .min(1, 'Cart is empty')
    .max(MAX_CHECKOUT_LINES)
    .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, {
      message: 'Each product may appear only once',
    }),
});

export const idempotencyKeySchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{8,128}$/, 'Idempotency key must be 8-128 URL-safe characters');
