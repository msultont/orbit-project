import { ORDER_STATUS_SIMULATED, type Order, type OrderLine } from '@orbit/shared';
import type { Queryable } from '../db/client.js';

interface OrderRow {
  id: string;
  status: 'SIMULATED';
  total_amount: number;
  currency: string;
  created_at: Date;
}

interface OrderItemRow {
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface NewOrder {
  totalAmount: number;
  currency: string;
  idempotencyKey?: string;
  lines: OrderLine[];
}

const toOrder = (row: OrderRow, lines: OrderLine[]): Order => ({
  id: row.id,
  status: row.status,
  currency: row.currency.trim(),
  totalAmount: row.total_amount,
  totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
  items: lines,
  createdAt: row.created_at.toISOString(),
});

const toLine = (row: OrderItemRow): OrderLine => ({
  productId: row.product_id,
  productName: row.product_name,
  unitPrice: row.unit_price,
  quantity: row.quantity,
  lineTotal: row.line_total,
});

const ORDER_COLUMNS = 'id, status, total_amount, currency, created_at';

async function loadLines(db: Queryable, orderId: string): Promise<OrderLine[]> {
  const rows = await db.query<OrderItemRow>(
    `SELECT product_id, product_name, unit_price, quantity, line_total
       FROM order_items WHERE order_id = $1 ORDER BY product_id`,
    [orderId],
  );
  return rows.map(toLine);
}

export const orderRepository = {
  async findByIdempotencyKey(db: Queryable, key: string): Promise<Order | null> {
    const [row] = await db.query<OrderRow>(
      `SELECT ${ORDER_COLUMNS} FROM orders WHERE idempotency_key = $1`,
      [key],
    );
    return row ? toOrder(row, await loadLines(db, row.id)) : null;
  },

  /** Returns null when the idempotency key is already taken. */
  async insert(db: Queryable, order: NewOrder): Promise<Order | null> {
    const [row] = await db.query<OrderRow>(
      `INSERT INTO orders (status, total_amount, currency, idempotency_key)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING ${ORDER_COLUMNS}`,
      [ORDER_STATUS_SIMULATED, order.totalAmount, order.currency, order.idempotencyKey ?? null],
    );
    if (!row) return null;

    for (const line of order.lines) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [row.id, line.productId, line.productName, line.unitPrice, line.quantity, line.lineTotal],
      );
    }
    return toOrder(row, [...order.lines].sort((a, b) => a.productId - b.productId));
  },
};
