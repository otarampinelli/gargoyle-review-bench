import type { Db } from '../db.ts';
import { ClientError } from '../errors.ts';
import { retry } from '../lib/retry.ts';
import { getOrderForUser } from '../orders/service.ts';
import { setOrderStatus } from '../orders/repo.ts';
import { isRetryableGatewayError, type Charge, type PaymentGateway } from './gateway.ts';
import { insertPayment } from './repo.ts';

export async function payOrder(db: Db, gateway: PaymentGateway, orderId: number, userId: number): Promise<Charge> {
  const order = getOrderForUser(db, orderId, userId);
  if (order.status !== 'pending') {
    throw new ClientError(409, `order ${orderId} is ${order.status}`);
  }
  // one key per order, so a retry or a double click can't charge twice
  const charge = await retry(
    () =>
      gateway.charge({
        amountMinor: order.totalMinor,
        currency: order.currency,
        idempotencyKey: `order-${order.id}`,
        description: `Shopkit order ${order.id}`,
      }),
    { attempts: 3, baseDelayMs: 200, isRetryable: isRetryableGatewayError },
  );
  insertPayment(db, {
    orderId: order.id,
    providerId: charge.id,
    amountMinor: order.totalMinor,
    currency: order.currency,
    status: charge.status,
  });
  if (charge.status === 'succeeded') {
    setOrderStatus(db, order.id, 'paid');
  }
  return charge;
}
