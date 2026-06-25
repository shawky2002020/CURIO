export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public errors?: Record<string, string[]>;
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code = 'INTERNAL_ERROR',
    errors?: Record<string, string[]>,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
