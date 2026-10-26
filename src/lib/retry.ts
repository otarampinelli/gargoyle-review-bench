export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  /** only errors this returns true for are tried again */
  isRetryable: (error: unknown) => boolean;
}

/** runs `fn` until it succeeds, with exponential backoff between attempts */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === options.attempts || !options.isRetryable(error)) {
        break;
      }
      await sleep(options.baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
