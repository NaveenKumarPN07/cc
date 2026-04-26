/**
 * Auth Routes
 */

import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  addAddress,
  deleteAddress,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateMiddleware.js';

const router = express.Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);

router.use(protect); // All routes below require auth

router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.post('/address', addAddress);
router.delete('/address/:addressId', deleteAddress);

export default router;
