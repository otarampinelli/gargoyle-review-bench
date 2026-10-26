import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOrder } from '../src/orders/service.ts';
import { getOrder } from '../src/orders/repo.ts';
import { GatewayError, type ChargeRequest, type PaymentGateway } from '../src/payments/gateway.ts';
import { payOrder } from '../src/payments/service.ts';
import { seed } from './helpers.ts';

function flakyGateway(failures: number): PaymentGateway & { keys: string[] } {
  const keys: string[] = [];
  return {
    keys,
    async charge(request: ChargeRequest) {
      keys.push(request.idempotencyKey);
      if (keys.length <= failures) {
        throw new GatewayError('bad gateway', 502);
      }
      return { id: 'ch_1', status: 'succeeded' };
    },
  };
}

test('a retried charge keeps its idempotency key and marks the order paid', async () => {
  const { db, user, mug } = seed();
  const order = createOrder(db, user.id, [{ productId: mug.id, quantity: 1 }]);
  const gateway = flakyGateway(1);
  await payOrder(db, gateway, order.id, user.id);
  assert.deepEqual(gateway.keys, [`order-${order.id}`, `order-${order.id}`]);
  assert.equal(getOrder(db, order.id)?.status, 'paid');
});

test('a declined request is not retried', async () => {
  const { db, user, mug } = seed();
  const order = createOrder(db, user.id, [{ productId: mug.id, quantity: 1 }]);
  let calls = 0;
  const gateway: PaymentGateway = {
    async charge() {
      calls++;
      throw new GatewayError('card declined', 402);
    },
  };
  await assert.rejects(payOrder(db, gateway, order.id, user.id), GatewayError);
  assert.equal(calls, 1);
});
