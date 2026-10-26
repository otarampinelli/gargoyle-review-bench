export interface ChargeRequest {
  amountMinor: number;
  currency: string;
  /** the same key always means the same charge, the provider never charges it twice */
  idempotencyKey: string;
  description: string;
}

export interface Charge {
  id: string;
  status: 'succeeded' | 'declined';
}

export interface PaymentGateway {
  charge(request: ChargeRequest): Promise<Charge>;
}

export class GatewayError extends Error {
  /** HTTP status from the provider, undefined when the request never got an answer */
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export class HttpPaymentGateway implements PaymentGateway {
  readonly #url: string;
  readonly #apiKey: string;

  constructor(url: string, apiKey: string) {
    this.#url = url;
    this.#apiKey = apiKey;
  }

  async charge(request: ChargeRequest): Promise<Charge> {
    let response: Response;
    try {
      response = await fetch(`${this.#url}/v1/charges`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.#apiKey}`,
          'content-type': 'application/json',
          'idempotency-key': request.idempotencyKey,
        },
        body: JSON.stringify({
          amount: request.amountMinor,
          currency: request.currency.toLowerCase(),
          description: request.description,
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      throw new GatewayError(`payment provider unreachable: ${(error as Error).message}`);
    }
    if (!response.ok) {
      throw new GatewayError(`payment provider answered ${response.status}`, response.status);
    }
    return (await response.json()) as Charge;
  }
}

/** network failures, rate limits and provider errors, never a request the provider refused */
export function isRetryableGatewayError(error: unknown): boolean {
  if (!(error instanceof GatewayError)) {
    return false;
  }
  return error.status === undefined || error.status === 429 || error.status >= 500;
}
