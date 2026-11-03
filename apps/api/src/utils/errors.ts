export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (message = 'Resource not found') => new AppError(404, 'NOT_FOUND', message);

/** Raised inside a checkout transaction when the idempotency key was claimed concurrently. */
export class DuplicateOrderError extends Error {
  constructor() {
    super('Order with this idempotency key already exists');
    this.name = 'DuplicateOrderError';
  }
}
