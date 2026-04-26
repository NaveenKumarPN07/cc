import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  deleteReview,
  getCategories,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateMiddleware.js';

const router = express.Router();

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }),
  body('category').notEmpty().withMessage('Category is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);

// Protected routes
router.post('/:id/reviews', protect, addReview);
router.delete('/:id/reviews', protect, deleteReview);

// Admin routes
router.post('/', protect, authorize('admin'), productValidation, validateRequest, createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

export default router;
