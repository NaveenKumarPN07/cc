/**
 * Order Controller
 * Place, track, and manage orders
 */

import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

// ─── @POST /api/orders ─────────────────────────────────────────────────────────

export const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'COD', notes } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user.id }).populate(
    'items.product',
    'stock price discountPrice name images isActive'
  );

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Validate stock availability & build order items
  const orderItems = [];
  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive) {
      throw new AppError(`Product "${item.name}" is no longer available`, 400);
    }

    if (product.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${item.name}". Only ${product.stock} available.`,
        400
      );
    }

    orderItems.push({
      product: product._id,
      name: item.name,
      image: item.image,
      price: product.discountPrice || product.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    });
  }

  // Calculate pricing
  const itemsPrice = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shippingPrice = itemsPrice >= 499 ? 0 : 49; // Free shipping above ₹499
  const taxRate = 0.18; // 18% GST
  const taxPrice = Math.round(itemsPrice * taxRate * 100) / 100;
  const discountAmount = cart.discountAmount || 0;
  const totalPrice = itemsPrice + shippingPrice + taxPrice - discountAmount;

  // Create order
  const order = await Order.create({
    user: req.user.id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    discountAmount,
    couponCode: cart.couponCode,
    totalPrice: Math.max(0, totalPrice),
    notes,
    orderStatus: 'Pending',
    statusHistory: [{ status: 'Pending' }],
  });

  // Deduct stock
  await Promise.all(
    orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      })
    )
  );

  // Clear cart
  await Cart.findByIdAndUpdate(cart._id, {
    items: [],
    couponCode: null,
    discountAmount: 0,
  });

  const populatedOrder = await Order.findById(order._id).populate(
    'user',
    'name email'
  );

  res.status(201).json({
    success: true,
    message: 'Order placed successfully!',
    order: populatedOrder,
  });
});

// ─── @GET /api/orders/my ──────────────────────────────────────────────────────

export const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user.id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: req.user.id }),
  ]);

  res.json({
    success: true,
    orders,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  });
});

// ─── @GET /api/orders/:id ─────────────────────────────────────────────────────

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email phone'
  );

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Users can only view their own orders; admins can view all
  if (
    order.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    throw new AppError('Not authorized to view this order', 403);
  }

  res.json({ success: true, order });
});

// ─── @PUT /api/orders/:id/cancel ─────────────────────────────────────────────

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) throw new AppError('Order not found', 404);

  if (order.user.toString() !== req.user.id) {
    throw new AppError('Not authorized', 403);
  }

  const cancellableStatuses = ['Pending', 'Processing'];
  if (!cancellableStatuses.includes(order.orderStatus)) {
    throw new AppError(
      `Cannot cancel order in "${order.orderStatus}" status`,
      400
    );
  }

  // Restore stock
  await Promise.all(
    order.orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      })
    )
  );

  order.orderStatus = 'Cancelled';
  order.statusHistory.push({ status: 'Cancelled', note: req.body.reason });
  await order.save();

  res.json({ success: true, message: 'Order cancelled successfully', order });
});

// ─── Admin Controllers ─────────────────────────────────────────────────────────

// @GET /api/orders (Admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.userId) filter.user = req.query.userId;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  // Dashboard stats
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        revenue: { $sum: '$totalPrice' },
      },
    },
  ]);

  res.json({
    success: true,
    orders,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    stats,
  });
});

// @PUT /api/orders/:id/status (Admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  const validTransitions = {
    Pending: ['Processing', 'Cancelled'],
    Processing: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered'],
    Delivered: [],
    Cancelled: [],
    Refunded: [],
  };

  if (!validTransitions[order.orderStatus]?.includes(status)) {
    throw new AppError(
      `Cannot transition from "${order.orderStatus}" to "${status}"`,
      400
    );
  }

  order.orderStatus = status;
  order.statusHistory.push({ status, note, updatedBy: req.user.id });

  if (status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.isPaid = true;
    order.paidAt = new Date();
  }

  if (trackingNumber) order.trackingNumber = trackingNumber;

  await order.save();

  res.json({
    success: true,
    message: `Order status updated to "${status}"`,
    order,
  });
});
