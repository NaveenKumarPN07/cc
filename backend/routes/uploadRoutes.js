/**
 * Upload Routes - Cloudinary image upload
 */

import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { protect, authorize } from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage for Cloudinary upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// @POST /api/upload/product
router.post(
  '/product',
  protect,
  authorize('admin'),
  upload.array('images', 5),
  asyncHandler(async (req, res) => {
    if (!req.files?.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploadPromises = req.files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'ajio-clone/products', resource_type: 'image' },
            (error, result) => {
              if (error) reject(error);
              else resolve({ url: result.secure_url, publicId: result.public_id });
            }
          );
          stream.end(file.buffer);
        })
    );

    const images = await Promise.all(uploadPromises);

    res.json({ success: true, images });
  })
);

// @DELETE /api/upload/:publicId
router.delete(
  '/:publicId',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ success: true, message: 'Image deleted' });
  })
);

export default router;
