/**
 * Global Error Handling Middleware
 */

import AppError from '../utils/AppError.js';

/**
 * 404 Handler - Route not found
 */
export const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

/**
 * Global Error Handler
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // ─── Mongoose Errors ────────────────────────────────────────────────────────

  // Invalid ObjectId
  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = new AppError(`${field} '${value}' already exists`, 400);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new AppError(messages.join('. '), 400);
  }

  // ─── JWT Errors ──────────────────────────────────────────────────────────────

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired, please login again', 401);
  }

  // ─── Response ────────────────────────────────────────────────────────────────

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    error.statusCode = 500;
    error.message = 'Internal server error';
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
    }),
  });
};
