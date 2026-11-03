import { CURRENCY, type CheckoutRequest, type Order, type OrderLine } from '@orbit/shared';
import type { Db } from '../db/client.js';
import { orderRepository } from '../repositories/orderRepository.js';
import { productRepository } from '../repositories/productRepository.js';
import { AppError, DuplicateOrderError } from '../utils/errors.js';

export interface CheckoutResult {
  order: Order;
  /** True when an earlier order with the same idempotency key was returned. */
  replayed: boolean;
}

const lineSignature = (lines: { productId: number; quantity: number }[]) =>
  lines
    .map((line) => `${line.productId}x${line.quantity}`)
    .sort()
    .join(',');

export function createCheckoutService(db: Db) {
  async function replay(key: string, request: CheckoutRequest): Promise<CheckoutResult | null> {
    const existing = await orderRepository.findByIdempotencyKey(db, key);
    if (!existing) return null;
    if (lineSignature(existing.items) !== lineSignature(request.items)) {
      throw new AppError(
        409,
        'IDEMPOTENCY_KEY_REUSED',
        'This idempotency key was already used with a different cart',
      );
    }
    return { order: existing, replayed: true };
  }

  return {
    async checkout(request: CheckoutRequest, idempotencyKey?: string): Promise<CheckoutResult> {
      if (idempotencyKey) {
        const replayed = await replay(idempotencyKey, request);
        if (replayed) return replayed;
      }

      try {
        const order = await db.transaction(async (tx) => {
          const products = await productRepository.findByIds(
            tx,
            request.items.map((item) => item.productId),
          );
          const byId = new Map(products.map((product) => [product.id, product]));

          const missing = request.items
            .filter((item) => !byId.has(item.productId))
            .map((item) => item.productId);
          if (missing.length > 0) {
            throw new AppError(422, 'PRODUCT_NOT_FOUND', 'Some products do not exist', {
              productIds: missing,
            });
          }

          // Prices and names always come from the database, never from the request.
          const lines: OrderLine[] = request.items.map((item) => {
            const product = byId.get(item.productId);
            if (!product) throw new Error('unreachable: product missing after validation');
            return {
              productId: product.id,
              productName: product.name,
              unitPrice: product.price,
              quantity: item.quantity,
              lineTotal: product.price * item.quantity,
            };
          });
          const totalAmount = lines.reduce((sum, line) => sum + line.lineTotal, 0);

          const created = await orderRepository.insert(tx, {
            totalAmount,
            currency: CURRENCY,
            idempotencyKey,
            lines,
          });
          if (!created) throw new DuplicateOrderError();
          return created;
        });
        return { order, replayed: false };
      } catch (error) {
        // A concurrent request won the race for this key: return its order.
        if (error instanceof DuplicateOrderError && idempotencyKey) {
          const replayed = await replay(idempotencyKey, request);
          if (replayed) return replayed;
        }
        throw error;
      }
    },
  };
}
