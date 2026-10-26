import type { Db } from '../db.ts';
import { nowIso } from '../lib/dates.ts';

export interface User {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

interface UserRow {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

/** emails are stored and looked up lowercased, so `Ana@x.com` and `ana@x.com` are one account */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function insertUser(db: Db, input: { email: string; name: string; passwordHash: string }): User {
  const row = db
    .prepare(
      'INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?) RETURNING *',
    )
    .get(normalizeEmail(input.email), input.name, input.passwordHash, nowIso()) as unknown as UserRow;
  return toUser(row);
}

export function findUserByEmail(db: Db, email: string): User | undefined {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(email)) as
    | UserRow
    | undefined;
  return row && toUser(row);
}

export function getUser(db: Db, id: number): User | undefined {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return row && toUser(row);
}
