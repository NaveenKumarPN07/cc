/**
 * User Controller - Admin Operations
 */

import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

// @GET /api/users (Admin)
export const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    users,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  });
});

// @GET /api/users/:id (Admin)
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('orderCount');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, user });
});

// @PUT /api/users/:id (Admin)
export const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;

  // Prevent self-demotion
  if (req.params.id === req.user.id && role !== 'admin') {
    throw new AppError('Cannot change your own role', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role, isActive },
    { new: true, runValidators: true }
  );

  if (!user) throw new AppError('User not found', 404);

  res.json({ success: true, message: 'User updated', user });
});

// @DELETE /api/users/:id (Admin)
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  // Soft delete
  user.isActive = false;
  await user.save();

  res.json({ success: true, message: 'User deactivated' });
});

// @POST /api/users/wishlist/:productId
export const toggleWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const productId = req.params.productId;

  const index = user.wishlist.indexOf(productId);
  let message;

  if (index === -1) {
    user.wishlist.push(productId);
    message = 'Added to wishlist';
  } else {
    user.wishlist.splice(index, 1);
    message = 'Removed from wishlist';
  }

  await user.save();

  res.json({
    success: true,
    message,
    wishlist: user.wishlist,
  });
});
