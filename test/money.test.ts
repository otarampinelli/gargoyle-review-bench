import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatMoney, percentOf, toMinor } from '../src/lib/money.ts';

test('parses decimal amounts without floating point', () => {
  assert.equal(toMinor('0.29', 'USD'), 29);
  assert.equal(toMinor('19.9', 'USD'), 1990);
  assert.equal(toMinor('1500', 'JPY'), 1500);
});

test('rejects more decimals than the currency has', () => {
  assert.throws(() => toMinor('1.5', 'JPY'));
  assert.throws(() => toMinor('1.234', 'USD'));
});

test('formats with the currency minor units', () => {
  assert.equal(formatMoney(1990, 'USD'), '$19.90');
  assert.equal(formatMoney(1500, 'JPY'), '¥1,500');
});

test('percent of rounds to the nearest minor unit', () => {
  assert.equal(percentOf(1999, 1000), 200);
  assert.equal(percentOf(10_000, 1250), 1250);
});
