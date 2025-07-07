export class CustomError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown; // Changed from any to unknown

  constructor(message: string, statusCode: number, code?: string, details?: unknown) { // Changed from any to unknown
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found', details?: unknown) { // Changed from any to unknown
    super(message, 404, 'NOT_FOUND', details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Conflict detected', details?: unknown) { // Changed from any to unknown
    super(message, 409, 'CONFLICT', details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}