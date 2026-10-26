import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSessionToken, verifySessionToken } from '../src/auth/sessions.ts';

test('a token carries its user until it expires', () => {
  const now = Date.UTC(2026, 0, 1);
  const token = createSessionToken(7, 'secret', 60, now);
  assert.equal(verifySessionToken(token, 'secret', now), 7);
  assert.equal(verifySessionToken(token, 'secret', now + 61_000), undefined);
});

test('a token signed with another secret is rejected', () => {
  const token = createSessionToken(7, 'secret', 60);
  assert.equal(verifySessionToken(token, 'other', Date.now()), undefined);
  assert.equal(verifySessionToken(`${token}x`, 'secret'), undefined);
});
