import type { Db } from '../db.ts';
import { nowIso } from '../lib/dates.ts';

export interface PaymentRecord {
  orderId: number;
  providerId: string;
  amountMinor: number;
  currency: string;
  status: string;
}

export function insertPayment(db: Db, payment: PaymentRecord): void {
  db.prepare(
    'INSERT INTO payments (order_id, provider_id, amount_minor, currency, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(payment.orderId, payment.providerId, payment.amountMinor, payment.currency, payment.status, nowIso());
}
