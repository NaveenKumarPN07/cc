// ─── Cart Routes ──────────────────────────────────────────────────────────────
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';

// Cart
import {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart,
} from '../controllers/cartController.js';

const cartRouter = express.Router();
cartRouter.use(protect);

cartRouter.get('/', getCart);
cartRouter.post('/', addToCart);
cartRouter.put('/:itemId', updateCartItem);
cartRouter.delete('/:itemId', removeFromCart);
cartRouter.delete('/', clearCart);

export { cartRouter as default };
