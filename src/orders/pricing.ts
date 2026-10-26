import { percentOf } from '../lib/money.ts';
import type { OrderItem } from './repo.ts';

export function subtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPriceMinor * item.quantity, 0);
}

/** the total after a discount in basis points, never below zero */
export function totalAfterDiscount(items: OrderItem[], discountBasisPoints: number): number {
  const amount = subtotal(items);
  return Math.max(0, amount - percentOf(amount, discountBasisPoints));
}
