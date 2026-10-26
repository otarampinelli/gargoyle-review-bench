export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** `2026-03-08` for any time on that UTC day */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}
