import type { Product } from '@orbit/shared';
import type { Queryable } from '../db/client.js';
import { productRepository } from '../repositories/productRepository.js';

export function createProductService(db: Queryable) {
  return {
    list: (search?: string): Promise<Product[]> => productRepository.list(db, search || undefined),
  };
}
