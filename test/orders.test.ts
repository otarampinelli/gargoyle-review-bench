import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NotFound, OutOfStock } from '../src/errors.ts';
import { createOrder, getOrderForUser } from '../src/orders/service.ts';
import { getProduct } from '../src/products/repo.ts';
import { seed } from './helpers.ts';

test('an order takes its units out of stock', () => {
  const { db, user, mug, shirt } = seed();
  const order = createOrder(db, user.id, [
    { productId: mug.id, quantity: 2 },
    { productId: shirt.id, quantity: 1 },
  ]);
  assert.equal(order.totalMinor, 2 * 1250 + 2000);
  assert.equal(getProduct(db, mug.id)?.stock, 1);
});

test('an order that runs out of stock changes nothing', () => {
  const { db, user, mug, shirt } = seed();
  assert.throws(
    () =>
      createOrder(db, user.id, [
        { productId: shirt.id, quantity: 1 },
        { productId: mug.id, quantity: 4 },
      ]),
    OutOfStock,
  );
  assert.equal(getProduct(db, shirt.id)?.stock, 10);
});

test('a discount comes off the subtotal', () => {
  const { db, user, shirt } = seed();
  const order = createOrder(db, user.id, [{ productId: shirt.id, quantity: 1 }], 1000);
  assert.equal(order.totalMinor, 1800);
});

test("someone else's order looks missing", () => {
  const { db, user, other, mug } = seed();
  const order = createOrder(db, user.id, [{ productId: mug.id, quantity: 1 }]);
  assert.equal(getOrderForUser(db, order.id, user.id).id, order.id);
  assert.throws(() => getOrderForUser(db, order.id, other.id), NotFound);
});
