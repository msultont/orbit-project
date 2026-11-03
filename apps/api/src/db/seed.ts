import type { Db } from './client.js';
import { SEED_PRODUCTS } from './seedData.js';

/** Idempotent: upserts the catalog by id and realigns the id sequence. */
export async function seed(db: Db): Promise<number> {
  await db.transaction(async (tx) => {
    for (const product of SEED_PRODUCTS) {
      await tx.query(
        `INSERT INTO products (id, name, price, image_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name,
               price = EXCLUDED.price,
               image_url = EXCLUDED.image_url,
               updated_at = now()`,
        [product.id, product.name, product.price, product.imageUrl],
      );
    }
    await tx.query(
      `SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT max(id) FROM products))`,
    );
  });
  return SEED_PRODUCTS.length;
}
