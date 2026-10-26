import type { Db } from '../db.ts';
import { nowIso } from '../lib/dates.ts';
import type { Page } from '../lib/pagination.ts';

export type OrderStatus = 'pending' | 'paid' | 'cancelled';

export interface OrderItem {
  productId: number;
  quantity: number;
  unitPriceMinor: number;
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  totalMinor: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
}

interface OrderRow {
  id: number;
  user_id: number;
  status: OrderStatus;
  total_minor: number;
  currency: string;
  created_at: string;
}

interface ItemRow {
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price_minor: number;
}

function toItem(row: ItemRow): OrderItem {
  return { productId: row.product_id, quantity: row.quantity, unitPriceMinor: row.unit_price_minor };
}

function toOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    totalMinor: row.total_minor,
    currency: row.currency,
    createdAt: row.created_at,
    items,
  };
}

export function insertOrder(
  db: Db,
  input: { userId: number; totalMinor: number; currency: string; items: OrderItem[] },
): Order {
  const row = db
    .prepare(
      "INSERT INTO orders (user_id, status, total_minor, currency, created_at) VALUES (?, 'pending', ?, ?, ?) RETURNING *",
    )
    .get(input.userId, input.totalMinor, input.currency, nowIso()) as unknown as OrderRow;
  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, quantity, unit_price_minor) VALUES (?, ?, ?, ?)',
  );
  for (const item of input.items) {
    insertItem.run(row.id, item.productId, item.quantity, item.unitPriceMinor);
  }
  return toOrder(row, input.items);
}

export function getOrder(db: Db, id: number): Order | undefined {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
  if (!row) {
    return undefined;
  }
  const items = db
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id')
    .all(id) as unknown as ItemRow[];
  return toOrder(row, items.map(toItem));
}

/** a user's orders, newest first, with their items loaded in one query */
export function listOrdersForUser(db: Db, userId: number, page: Page): Order[] {
  const rows = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?')
    .all(userId, page.size, page.offset) as unknown as OrderRow[];
  if (rows.length === 0) {
    return [];
  }
  const ids = rows.map((row) => row.id);
  const items = db
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${ids.map(() => '?').join(', ')}) ORDER BY id`)
    .all(...ids) as unknown as ItemRow[];
  return rows.map((row) =>
    toOrder(
      row,
      items.filter((item) => item.order_id === row.id).map(toItem),
    ),
  );
}

export function setOrderStatus(db: Db, id: number, status: OrderStatus): void {
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
}
