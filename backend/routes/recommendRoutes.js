/**
 * Recommendation Routes
 * Add this file as: backend/routes/recommendRoutes.js
 * Then add to server.js: import recommendRoutes from './routes/recommendRoutes.js';
 *                        app.use('/api/recommendations', recommendRoutes);
 */

import express from 'express';
import {
  getRecommendations,
  getSimilarProducts,
  getPopular,
  getSalesAnalytics,
  triggerRetraining,
  getModelStatus,
} from '../controllers/recommendController.js';
import { protect, authorize } from '../../backend/middleware/authMiddleware.js';

const router = express.Router();

// ── Public routes (no auth required) ─────────────────────────────────────────
router.get('/popular',          getPopular);
router.get('/similar/:productId', getSimilarProducts);

// ── Auth required ─────────────────────────────────────────────────────────────
router.get('/', protect, getRecommendations);

// ── Admin only ────────────────────────────────────────────────────────────────
router.get('/analytics',  protect, authorize('admin'), getSalesAnalytics);
router.post('/train',     protect, authorize('admin'), triggerRetraining);
router.get('/status',     protect, authorize('admin'), getModelStatus);

export default router;
