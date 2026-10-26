import { hashPassword, verifyPassword } from '../auth/passwords.ts';
import { createSessionToken } from '../auth/sessions.ts';
import type { Config } from '../config.ts';
import type { Db } from '../db.ts';
import { ClientError } from '../errors.ts';
import { findUserByEmail, insertUser, type User } from './repo.ts';

const MIN_PASSWORD_LENGTH = 12;

export async function register(
  db: Db,
  input: { email: string; name: string; password: string },
): Promise<User> {
  if (!input.email.includes('@')) {
    throw new ClientError(400, 'invalid email');
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new ClientError(400, `password must have at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (findUserByEmail(db, input.email)) {
    throw new ClientError(409, 'email already registered');
  }
  const passwordHash = await hashPassword(input.password);
  return insertUser(db, { email: input.email, name: input.name.trim(), passwordHash });
}

/** a session token, or undefined for a wrong email or password, the caller can't tell which */
export async function login(
  db: Db,
  config: Config,
  email: string,
  password: string,
): Promise<string | undefined> {
  const user = findUserByEmail(db, email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return undefined;
  }
  return createSessionToken(user.id, config.sessionSecret, config.sessionTtlSeconds);
}
