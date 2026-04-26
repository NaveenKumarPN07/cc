/**
 * Custom Application Error Class
 */
export default class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguish from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}
