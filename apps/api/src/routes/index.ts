import { Router } from 'express';
import { checkoutRequestSchema, productsQuerySchema, type HealthResponse } from '@orbit/shared';
import type { Db } from '../db/client.js';
import { createCheckoutController, createProductController } from '../controllers/controllers.js';
import { validate } from '../middleware/validate.js';
import { createCheckoutService } from '../services/checkoutService.js';
import { createProductService } from '../services/productService.js';

export function createApiRouter(db: Db): Router {
  const router = Router();
  const products = createProductController(createProductService(db));
  const checkout = createCheckoutController(createCheckoutService(db));

  router.get('/health', async (_req, res) => {
    try {
      await db.query('SELECT 1');
      const body: HealthResponse = { status: 'ok', database: 'up' };
      res.json(body);
    } catch {
      const body: HealthResponse = { status: 'degraded', database: 'down' };
      res.status(503).json(body);
    }
  });

  router.get('/products', validate(productsQuerySchema, 'query'), products.list);
  router.post('/checkout', validate(checkoutRequestSchema, 'body'), checkout.create);

  return router;
}
