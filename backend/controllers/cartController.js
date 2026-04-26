/**
 * Cart Controller
 * Server-side cart management
 */

import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

// ─── @GET /api/cart ────────────────────────────────────────────────────────────

export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate(
    'items.product',
    'name images price discountPrice stock isActive'
  );

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  // Filter out inactive/deleted products
  const validItems = cart.items.filter(
    (item) => item.product && item.product.isActive
  );

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  res.json({
    success: true,
    cart: {
      ...cart.toJSON(),
      totalItems: cart.totalItems,
      subtotal: cart.subtotal,
      total: cart.total,
    },
  });
});

// ─── @POST /api/cart ───────────────────────────────────────────────────────────

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size, color } = req.body;

  // Validate product
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new AppError('Product not found', 404);
  }

  if (product.stock < quantity) {
    throw new AppError(`Only ${product.stock} items available in stock`, 400);
  }

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }

  // Check if item already in cart (same product + size + color)
  const existingIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color
  );

  const effectivePrice = product.discountPrice || product.price;

  if (existingIndex > -1) {
    const newQty = cart.items[existingIndex].quantity + quantity;
    if (newQty > 10) {
      throw new AppError('Maximum 10 items per product allowed', 400);
    }
    if (newQty > product.stock) {
      throw new AppError(`Only ${product.stock} items available`, 400);
    }
    cart.items[existingIndex].quantity = newQty;
    cart.items[existingIndex].price = effectivePrice; // Update price in case it changed
  } else {
    cart.items.push({
      product: productId,
      name: product.name,
      image: product.images[0]?.url || '',
      price: effectivePrice,
      quantity,
      size,
      color,
    });
  }

  await cart.save();

  res.status(201).json({
    success: true,
    message: 'Item added to cart',
    totalItems: cart.totalItems,
  });
});

// ─── @PUT /api/cart/:itemId ────────────────────────────────────────────────────

export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  if (quantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) throw new AppError('Cart not found', 404);

  const itemIndex = cart.items.findIndex(
    (item) => item._id.toString() === req.params.itemId
  );

  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  // Check stock
  const product = await Product.findById(cart.items[itemIndex].product);
  if (product && product.stock < quantity) {
    throw new AppError(`Only ${product.stock} items available`, 400);
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  res.json({
    success: true,
    message: 'Cart updated',
    subtotal: cart.subtotal,
    totalItems: cart.totalItems,
  });
});

// ─── @DELETE /api/cart/:itemId ─────────────────────────────────────────────────

export const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) throw new AppError('Cart not found', 404);

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== req.params.itemId
  );

  await cart.save();

  res.json({
    success: true,
    message: 'Item removed from cart',
    totalItems: cart.totalItems,
  });
});

// ─── @DELETE /api/cart ─────────────────────────────────────────────────────────

export const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items: [], couponCode: null, discountAmount: 0 }
  );

  res.json({ success: true, message: 'Cart cleared' });
});
