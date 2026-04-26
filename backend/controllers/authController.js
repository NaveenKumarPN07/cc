/**
 * Auth Controller
 * Handles registration, login, logout, profile
 */

import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

/**
 * Send token response with cookie
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.generateAuthToken();

  // Remove password from output
  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: userObj,
  });
};

// ─── @POST /api/auth/register ─────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  const user = await User.create({ name, email, password, phone });
  sendTokenResponse(user, 201, res, 'Registration successful');
});

// ─── @POST /api/auth/login ────────────────────────────────────────────────────

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Get user with password field
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account deactivated. Please contact support.', 401);
  }

  sendTokenResponse(user, 200, res, 'Login successful');
});

// ─── @GET /api/auth/me ────────────────────────────────────────────────────────

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('wishlist', 'name images price discountPrice');

  res.json({
    success: true,
    user,
  });
});

// ─── @PUT /api/auth/profile ────────────────────────────────────────────────────

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, phone },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user,
  });
});

// ─── @PUT /api/auth/password ──────────────────────────────────────────────────

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated successfully');
});

// ─── @POST /api/auth/address ──────────────────────────────────────────────────

export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  // If this is set as default, unset others
  if (req.body.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push(req.body);
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    addresses: user.addresses,
  });
});

// ─── @DELETE /api/auth/address/:addressId ─────────────────────────────────────

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  user.addresses = user.addresses.filter(
    (addr) => addr._id.toString() !== req.params.addressId
  );

  await user.save();

  res.json({
    success: true,
    message: 'Address removed',
    addresses: user.addresses,
  });
});
