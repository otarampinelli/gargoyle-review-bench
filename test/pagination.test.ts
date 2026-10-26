import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_PAGE_SIZE, parsePage } from '../src/lib/pagination.ts';

test('the first page starts at zero', () => {
  assert.deepEqual(parsePage(new URLSearchParams('page=1&size=10')), { page: 1, size: 10, offset: 0 });
  assert.deepEqual(parsePage(new URLSearchParams('page=3&size=10')), { page: 3, size: 10, offset: 20 });
});

test('bad input falls back to the defaults and the size is capped', () => {
  assert.deepEqual(parsePage(new URLSearchParams('page=-4&size=abc')), { page: 1, size: 20, offset: 0 });
  assert.equal(parsePage(new URLSearchParams('size=5000')).size, MAX_PAGE_SIZE);
});
