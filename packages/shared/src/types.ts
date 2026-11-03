import type { z } from 'zod';
import type { checkoutRequestSchema, checkoutItemSchema } from './schemas.js';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  /** Whole NT$ amount. */
  price: number;
  imageUrl: string | null;
}

export type CheckoutItem = z.infer<typeof checkoutItemSchema>;
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export interface OrderLine {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  status: 'SIMULATED';
  currency: string;
  totalAmount: number;
  totalQuantity: number;
  items: OrderLine[];
  createdAt: string;
}

export interface ProductsResponse {
  data: Product[];
}

export interface CheckoutResponse {
  data: Order;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
}
