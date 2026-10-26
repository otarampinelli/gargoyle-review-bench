import { type Db, transaction } from '../db.ts';
import { ClientError, NotFound, OutOfStock } from '../errors.ts';
import { getProduct, reserveStock } from '../products/repo.ts';
import { totalAfterDiscount } from './pricing.ts';
import { getOrder, insertOrder, type Order, type OrderItem } from './repo.ts';

export interface OrderLine {
  productId: number;
  quantity: number;
}

/** reserves the stock and records the order, all or nothing */
export function createOrder(db: Db, userId: number, lines: OrderLine[], discountBasisPoints = 0): Order {
  if (lines.length === 0) {
    throw new ClientError(400, 'an order needs at least one line');
  }
  return transaction(db, () => {
    const items: OrderItem[] = [];
    let currency: string | undefined;
    for (const line of lines) {
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        throw new ClientError(400, 'quantity must be a positive integer');
      }
      const product = getProduct(db, line.productId);
      if (!product) {
        throw new NotFound(`product ${line.productId}`);
      }
      if (currency && product.currency !== currency) {
        throw new ClientError(400, 'all products in an order must share a currency');
      }
      currency = product.currency;
      if (!reserveStock(db, product.id, line.quantity)) {
        throw new OutOfStock(product.sku);
      }
      items.push({ productId: product.id, quantity: line.quantity, unitPriceMinor: product.priceMinor });
    }
    const totalMinor = totalAfterDiscount(items, discountBasisPoints);
    return insertOrder(db, { userId, totalMinor, currency: currency!, items });
  });
}

/** the order if it belongs to `userId`, someone else's order looks like a missing one */
export function getOrderForUser(db: Db, orderId: number, userId: number): Order {
  const order = getOrder(db, orderId);
  if (!order || order.userId !== userId) {
    throw new NotFound(`order ${orderId}`);
  }
  return order;
}
