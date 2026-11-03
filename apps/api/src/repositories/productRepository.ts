import type { Product } from '@orbit/shared';
import type { Queryable } from '../db/client.js';

interface ProductRow {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: row.price,
  imageUrl: row.image_url,
});

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

export const productRepository = {
  async list(db: Queryable, search?: string): Promise<Product[]> {
    const columns = 'id, name, description, price, image_url';
    const rows = search
      ? await db.query<ProductRow>(
          `SELECT ${columns} FROM products WHERE name ILIKE $1 ESCAPE '\\' ORDER BY id`,
          [`%${escapeLike(search)}%`],
        )
      : await db.query<ProductRow>(`SELECT ${columns} FROM products ORDER BY id`);
    return rows.map(toProduct);
  },

  async findByIds(db: Queryable, ids: number[]): Promise<Product[]> {
    const rows = await db.query<ProductRow>(
      'SELECT id, name, description, price, image_url FROM products WHERE id = ANY($1::int[])',
      [ids],
    );
    return rows.map(toProduct);
  },
};
