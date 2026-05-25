/** Domain error hierarchy. Mapped to HTTP responses by errorHandler middleware. */

export class BaseError extends Error {
  status: number;
  type: string;
  constructor(message: string, status = 500, type = 'about:blank') {
    super(message);
    this.status = status;
    this.type = type;
  }
}
export class ValidationError extends BaseError {
  details: unknown;
  constructor(message: string, details?: unknown) {
    super(message, 422, 'https://sameem.hub/errors/validation');
    this.details = details;
  }
}
export class UnauthorizedError extends BaseError {
  constructor(msg = 'Unauthorized') { super(msg, 401, 'https://sameem.hub/errors/unauthorized'); }
}
export class ForbiddenError extends BaseError {
  constructor(msg = 'Forbidden') { super(msg, 403, 'https://sameem.hub/errors/forbidden'); }
}
export class NotFoundError extends BaseError {
  constructor(msg = 'Not found') { super(msg, 404, 'https://sameem.hub/errors/not-found'); }
}
export class ConflictError extends BaseError {
  constructor(msg = 'Conflict') { super(msg, 409, 'https://sameem.hub/errors/conflict'); }
}
