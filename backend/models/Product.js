/**
 * Product Model
 * Full-featured product with variants, reviews, and inventory
 */

import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Review cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Men',
        'Women',
        'Kids',
        'Footwear',
        'Accessories',
        'Sports',
        'Beauty',
        'Home',
        'Electronics',
      ],
    },
    subCategory: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
        alt: { type: String, default: '' },
      },
    ],
    sizes: [
      {
        size: { type: String, required: true }, // XS, S, M, L, XL, XXL or numeric
        stock: { type: Number, required: true, min: 0, default: 0 },
      },
    ],
    colors: [
      {
        name: { type: String },
        hex: { type: String },
      },
    ],
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],
    tags: [{ type: String, lowercase: true, trim: true }],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────────

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

// ─── Virtuals ───────────────────────────────────────────────────────────────────

productSchema.virtual('discountPercent').get(function () {
  if (this.discountPrice && this.price > 0) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

productSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice || this.price;
});

// ─── Methods ────────────────────────────────────────────────────────────────────

// Recalculate rating after review added/removed
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    const totalRating = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.rating = Math.round((totalRating / this.reviews.length) * 10) / 10;
    this.numReviews = this.reviews.length;
  }
};

export default mongoose.model('Product', productSchema);
