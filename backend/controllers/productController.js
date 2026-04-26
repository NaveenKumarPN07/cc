/**
 * Product Controller
 * Full CRUD + search, filtering, reviews
 */

import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import APIFeatures from '../utils/APIFeatures.js';

// ─── @GET /api/products ───────────────────────────────────────────────────────

export const getProducts = asyncHandler(async (req, res) => {
  // Build base query - only active products
  const baseQuery = Product.find({ isActive: true });

  // Apply price range filter manually (before APIFeatures)
  const queryObj = { isActive: true };

  if (req.query.minPrice || req.query.maxPrice) {
    queryObj.price = {};
    if (req.query.minPrice) queryObj.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) queryObj.price.$lte = Number(req.query.maxPrice);
  }

  if (req.query.category) queryObj.category = req.query.category;
  if (req.query.brand) queryObj.brand = { $regex: req.query.brand, $options: 'i' };
  if (req.query.isFeatured) queryObj.isFeatured = req.query.isFeatured === 'true';

  // Search
  if (req.query.search) {
    queryObj.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { brand: { $regex: req.query.search, $options: 'i' } },
      { tags: { $in: [new RegExp(req.query.search, 'i')] } },
    ];
  }

  // Sort options
  let sortBy = '-createdAt';
  if (req.query.sort === 'price_asc') sortBy = 'price';
  if (req.query.sort === 'price_desc') sortBy = '-price';
  if (req.query.sort === 'rating') sortBy = '-rating';
  if (req.query.sort === 'newest') sortBy = '-createdAt';
  if (req.query.sort === 'popular') sortBy = '-numReviews';

  // Pagination
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip = (page - 1) * limit;

  // Execute queries in parallel
  const [products, total] = await Promise.all([
    Product.find(queryObj)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .select('-reviews'),
    Product.countDocuments(queryObj),
  ]);

  res.json({
    success: true,
    count: products.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    products,
  });
});

// ─── @GET /api/products/:id ────────────────────────────────────────────────────

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    'reviews.user',
    'name avatar'
  );

  if (!product || !product.isActive) {
    throw new AppError('Product not found', 404);
  }

  // Get related products
  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  })
    .limit(8)
    .select('name images price discountPrice rating numReviews brand');

  res.json({
    success: true,
    product,
    related,
  });
});

// ─── @POST /api/products ─── (Admin) ──────────────────────────────────────────

export const createProduct = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    product,
  });
});

// ─── @PUT /api/products/:id ─── (Admin) ───────────────────────────────────────

export const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    message: 'Product updated successfully',
    product,
  });
});

// ─── @DELETE /api/products/:id ─── (Admin) ────────────────────────────────────

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Soft delete
  product.isActive = false;
  await product.save();

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

// ─── @POST /api/products/:id/reviews ──────────────────────────────────────────

export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user.id
  );

  if (alreadyReviewed) {
    throw new AppError('You have already reviewed this product', 400);
  }

  const review = {
    user: req.user.id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  product.reviews.push(review);
  product.updateRating();
  await product.save();

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    rating: product.rating,
    numReviews: product.numReviews,
  });
});

// ─── @DELETE /api/products/:id/reviews ────────────────────────────────────────

export const deleteReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const reviewIndex = product.reviews.findIndex(
    (r) => r.user.toString() === req.user.id
  );

  if (reviewIndex === -1) {
    throw new AppError('Review not found', 404);
  }

  product.reviews.splice(reviewIndex, 1);
  product.updateRating();
  await product.save();

  res.json({ success: true, message: 'Review deleted' });
});

// ─── @GET /api/products/categories ────────────────────────────────────────────

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, categories });
});
