/**
 * Recommendation Controller
 * ─────────────────────────
 * Acts as a proxy between the React frontend and the Python ML service.
 * Frontend never calls the ML service directly — all traffic goes through here.
 *
 * Add to backend/controllers/recommendController.js
 */

import axios from 'axios';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml_service:8000';
const ML_API_KEY     = process.env.ML_API_KEY     || 'internal_ml_secret';

// Shared axios instance for ML service
const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Fetch full product documents from MongoDB for a list of IDs.
 * Returns only active, in-stock products.
 */
async function fetchProducts(productIds, limit = 10) {
  if (!productIds?.length) return [];
  const { default: mongoose } = await import('mongoose');

  const validIds = productIds
    .filter((id) => mongoose.isValidObjectId(id))
    .slice(0, limit);

  const products = await Product.find({
    _id: { $in: validIds },
    isActive: true,
  }).select('name brand images price discountPrice rating numReviews category stock');

  // Preserve the ML-ranked order
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  return validIds.map((id) => productMap.get(id)).filter(Boolean);
}

// ── @GET /api/recommendations ──────────────────────────────────────────────────
// Personalized recommendations for logged-in user

export const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit  = Math.min(parseInt(req.query.limit) || 10, 20);

  let productIds = [];
  let source = 'popular';

  try {
    const { data } = await mlClient.post('/ml/recommend', {
      userId,
      topN: limit,
      excludeSeen: true,
    });
    productIds = data.recommendations || [];
    source = data.source || 'svd';
  } catch (err) {
    // ML service down → fall back to popular
    console.error('[ML] Recommendation service unavailable:', err.message);
    const { data } = await mlClient.get(`/ml/popular?limit=${limit}`).catch(() => ({
      data: { popularProducts: [] },
    }));
    productIds = data.popularProducts || [];
    source = 'popular_fallback';
  }

  const products = await fetchProducts(productIds, limit);

  res.json({
    success: true,
    source,
    count: products.length,
    products,
  });
});

// ── @GET /api/recommendations/similar/:productId ───────────────────────────────
// "You may also like" — items similar to a product (product detail page)

export const getSimilarProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 8, 16);

  let productIds = [];
  let source = 'popular';

  try {
    const { data } = await mlClient.post('/ml/similar', {
      productId,
      topN: limit,
    });
    productIds = data.similarProducts || [];
    source = data.source || 'svd_cosine';
  } catch (err) {
    console.error('[ML] Similar products unavailable:', err.message);
    // Fall back to same-category products from MongoDB
    const current = await Product.findById(productId).select('category');
    if (current) {
      const fallback = await Product.find({
        category: current.category,
        _id: { $ne: productId },
        isActive: true,
      })
        .sort({ rating: -1 })
        .limit(limit)
        .select('_id');
      productIds = fallback.map((p) => p._id.toString());
    }
    source = 'category_fallback';
  }

  const products = await fetchProducts(productIds, limit);

  res.json({
    success: true,
    source,
    count: products.length,
    products,
  });
});

// ── @GET /api/recommendations/popular ─────────────────────────────────────────
// Guest users — no auth required

export const getPopular = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 20);

  let productIds = [];

  try {
    const { data } = await mlClient.get(`/ml/popular?limit=${limit}`);
    productIds = data.popularProducts || [];
  } catch {
    // If ML is down, query MongoDB directly
    const products = await Product.find({ isActive: true })
      .sort({ numReviews: -1, rating: -1 })
      .limit(limit)
      .select('name brand images price discountPrice rating numReviews category stock');
    return res.json({ success: true, source: 'mongo_fallback', products });
  }

  const products = await fetchProducts(productIds, limit);
  res.json({ success: true, source: 'ml_popular', count: products.length, products });
});

// ── @GET /api/recommendations/analytics ───────────────────────────────────────
// Admin dashboard — sales analytics from ML service (Admin only)

export const getSalesAnalytics = asyncHandler(async (req, res) => {
  try {
    const [salesRes, userRes] = await Promise.all([
      mlClient.get('/ml/analytics/sales'),
      mlClient.get('/ml/analytics/users'),
    ]);
    res.json({
      success: true,
      sales: salesRes.data,
      users: userRes.data,
    });
  } catch (err) {
    throw new AppError('Analytics service unavailable: ' + err.message, 503);
  }
});

// ── @POST /api/recommendations/train ──────────────────────────────────────────
// Admin only — manually trigger model retraining

export const triggerRetraining = asyncHandler(async (req, res) => {
  try {
    await mlClient.post(
      '/ml/train',
      {},
      { headers: { Authorization: `Bearer ${ML_API_KEY}` } }
    );
    res.json({ success: true, message: 'Model retraining started in background' });
  } catch (err) {
    throw new AppError('Could not trigger retraining: ' + err.message, 503);
  }
});

// ── @GET /api/recommendations/status ──────────────────────────────────────────

export const getModelStatus = asyncHandler(async (req, res) => {
  try {
    const { data } = await mlClient.get('/ml/status');
    res.json({ success: true, ...data });
  } catch {
    res.json({ success: false, isTrained: false, message: 'ML service offline' });
  }
});
