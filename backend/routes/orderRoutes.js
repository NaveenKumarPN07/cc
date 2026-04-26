import express from 'express';
import {
  placeOrder, getMyOrders, getOrder, cancelOrder,
  getAllOrders, updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.post('/', placeOrder);
router.get('/my', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

// Admin
router.get('/', authorize('admin'), getAllOrders);
router.put('/:id/status', authorize('admin'), updateOrderStatus);

export default router;
