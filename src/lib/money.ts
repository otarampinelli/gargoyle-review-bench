// digits after the decimal point for each currency we sell in
const MINOR_UNITS: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  BRL: 2,
  JPY: 0,
};

export function minorUnits(currency: string): number {
  const units = MINOR_UNITS[currency];
  if (units === undefined) {
    throw new Error(`unsupported currency: ${currency}`);
  }
  return units;
}

/** parses a decimal string like "12.34" into minor units, without floating point */
export function toMinor(amount: string, currency: string): number {
  const units = minorUnits(currency);
  const match = /^(\d+)(?:\.(\d+))?$/.exec(amount.trim());
  if (!match) {
    throw new Error(`invalid amount: ${amount}`);
  }
  const [, whole, fraction = ''] = match;
  if (fraction.length > units) {
    throw new Error(`too many decimals for ${currency}: ${amount}`);
  }
  return Number(whole) * 10 ** units + Number(fraction.padEnd(units, '0') || '0');
}

export function formatMoney(minor: number, currency: string, locale = 'en-US'): string {
  const units = minorUnits(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: units,
    maximumFractionDigits: units,
  }).format(minor / 10 ** units);
}

/** a share of an amount in basis points (1% = 100), rounded to the nearest minor unit */
export function percentOf(minor: number, basisPoints: number): number {
  return Math.round((minor * basisPoints) / 10_000);
}
