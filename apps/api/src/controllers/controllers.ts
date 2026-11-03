import type { RequestHandler } from 'express';
import type { CheckoutRequest, CheckoutResponse, ProductsResponse } from '@orbit/shared';
import { IDEMPOTENCY_KEY_HEADER, idempotencyKeySchema } from '@orbit/shared';
import { getValidated } from '../middleware/validate.js';
import type { createCheckoutService } from '../services/checkoutService.js';
import type { createProductService } from '../services/productService.js';

export function createProductController(service: ReturnType<typeof createProductService>) {
  const list: RequestHandler = async (_req, res) => {
    const { search } = getValidated<{ search?: string }>(res, 'query');
    const body: ProductsResponse = { data: await service.list(search) };
    res.json(body);
  };
  return { list };
}

export function createCheckoutController(service: ReturnType<typeof createCheckoutService>) {
  const create: RequestHandler = async (req, res) => {
    const request = getValidated<CheckoutRequest>(res, 'body');
    const rawKey = req.get(IDEMPOTENCY_KEY_HEADER);
    const idempotencyKey = rawKey === undefined ? undefined : idempotencyKeySchema.parse(rawKey);

    const { order, replayed } = await service.checkout(request, idempotencyKey);
    const body: CheckoutResponse = { data: order };
    res.status(replayed ? 200 : 201).json(body);
  };
  return { create };
}
