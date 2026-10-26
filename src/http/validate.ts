import { ClientError } from '../errors.ts';

export function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ClientError(400, 'expected a JSON object');
  }
  return value as Record<string, unknown>;
}

export function string(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ClientError(400, `${key} must be a non-empty string`);
  }
  return value;
}

export function id(value: string | undefined, what: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new ClientError(400, `invalid ${what} id`);
  }
  return parsed;
}
