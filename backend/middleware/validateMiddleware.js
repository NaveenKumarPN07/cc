import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join('. ');
    throw new AppError(messages, 400);
  }
  next();
};
