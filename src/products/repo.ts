import type { Db } from '../db.ts';
import type { Page } from '../lib/pagination.ts';

export interface Product {
  id: number;
  sku: string;
  name: string;
  priceMinor: number;
  currency: string;
  stock: number;
}

interface ProductRow {
  id: number;
  sku: string;
  name: string;
  price_minor: number;
  currency: string;
  stock: number;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    priceMinor: row.price_minor,
    currency: row.currency,
    stock: row.stock,
  };
}

export function insertProduct(db: Db, input: Omit<Product, 'id'>): Product {
  const row = db
    .prepare(
      'INSERT INTO products (sku, name, price_minor, currency, stock) VALUES (?, ?, ?, ?, ?) RETURNING *',
    )
    .get(input.sku, input.name, input.priceMinor, input.currency, input.stock) as unknown as ProductRow;
  return toProduct(row);
}

export function getProduct(db: Db, id: number): Product | undefined {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined;
  return row && toProduct(row);
}

export function listProducts(db: Db, page: Page): Product[] {
  const rows = db
    .prepare('SELECT * FROM products ORDER BY id LIMIT ? OFFSET ?')
    .all(page.size, page.offset) as unknown as ProductRow[];
  return rows.map(toProduct);
}

/**
 * takes `quantity` units out of stock in one statement, so two orders can't both
 * take the last unit, false when there isn't enough
 */
export function reserveStock(db: Db, productId: number, quantity: number): boolean {
  const result = db
    .prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?')
    .run(quantity, productId, quantity);
  return result.changes === 1;
}

export function releaseStock(db: Db, productId: number, quantity: number): void {
  db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(quantity, productId);
}
