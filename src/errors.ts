/** an error the client caused, with the HTTP status it maps to */
export class ClientError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class NotFound extends ClientError {
  constructor(what: string) {
    super(404, `${what} not found`);
  }
}

export class OutOfStock extends ClientError {
  constructor(sku: string) {
    super(409, `${sku} is out of stock`);
  }
}
