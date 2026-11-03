import { describe, expect, it } from 'vitest';
import { checkoutRequestSchema, idempotencyKeySchema, productsQuerySchema } from './schemas.js';

describe('checkoutRequestSchema', () => {
  it('accepts valid items and strips client-supplied prices', () => {
    const parsed = checkoutRequestSchema.parse({
      items: [{ productId: 1, quantity: 2, price: 1 }],
      total: 1,
    });
    expect(parsed).toEqual({ items: [{ productId: 1, quantity: 2 }] });
  });

  it.each([
    ['empty cart', { items: [] }],
    ['zero quantity', { items: [{ productId: 1, quantity: 0 }] }],
    ['negative quantity', { items: [{ productId: 1, quantity: -1 }] }],
    ['decimal quantity', { items: [{ productId: 1, quantity: 1.5 }] }],
    ['huge quantity', { items: [{ productId: 1, quantity: 100000 }] }],
    ['string id', { items: [{ productId: '1', quantity: 1 }] }],
    ['duplicate products', { items: [{ productId: 1, quantity: 1 }, { productId: 1, quantity: 2 }] }],
    ['missing items', {}],
  ])('rejects %s', (_label, body) => {
    expect(checkoutRequestSchema.safeParse(body).success).toBe(false);
  });
});

describe('productsQuerySchema', () => {
  it('trims search text', () => {
    expect(productsQuerySchema.parse({ search: '  mouse ' })).toEqual({ search: 'mouse' });
  });

  it('rejects overly long search text', () => {
    expect(productsQuerySchema.safeParse({ search: 'a'.repeat(101) }).success).toBe(false);
  });
});

describe('idempotencyKeySchema', () => {
  it('accepts UUIDs and rejects unsafe values', () => {
    expect(idempotencyKeySchema.safeParse('3f2b8c1e-5a6d-4e0b-9d7a-1c2b3d4e5f60').success).toBe(true);
    expect(idempotencyKeySchema.safeParse('short').success).toBe(false);
    expect(idempotencyKeySchema.safeParse("bad key'; --").success).toBe(false);
  });
});
