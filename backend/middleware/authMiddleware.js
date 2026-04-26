/**
 * Authentication & Authorization Middleware
 */

import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

/**
 * Protect routes - verify JWT token
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authorized, no token provided', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database (excluding password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired, please login again', 401);
    }
    throw error;
  }
});

/**
 * Authorize specific roles
 * Usage: authorize('admin') or authorize('admin', 'manager')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        `Access denied. Required role: ${roles.join(' or ')}`,
        403
      );
    }
    next();
  };
};

/**
 * Optional auth - attach user if token provided, but don't require it
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // Token invalid, continue without user
    }
  }

  next();
});
