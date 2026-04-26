import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Heart, ShoppingBag, Truck, RotateCcw, Shield, Star, ChevronLeft,
  Plus, Minus, Check
} from 'lucide-react';
import { productAPI } from '../services/api';
import useAuthStore from '../context/authStore';
import useCartStore from '../context/cartStore';
import { userAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { Spinner, StarRating, ErrorMessage } from '../components/common';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const addToServerCart = useCartStore((s) => s.addToServerCart);
  const addLocalItem = useCartStore((s) => s.addLocalItem);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productAPI.getOne(id),
  });

  const reviewMutation = useMutation({
    mutationFn: (data) => productAPI.addReview(id, data),
    onSuccess: () => {
      toast.success('Review added!');
      setReviewText('');
      setReviewRating(5);
      queryClient.invalidateQueries(['product', id]);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !data?.product) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-gray-500 mb-4">Product not found.</p>
        <Link to="/products" className="btn-primary">Back to Products</Link>
      </div>
    );
  }

  const { product, related } = data;
  const {
    name, brand, images, price, discountPrice, description, category,
    sizes, stock, rating, numReviews, reviews,
  } = product;

  const effectivePrice = discountPrice || price;
  const discount = discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;

  const handleAddToCart = async () => {
    if (sizes?.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (isAuthenticated) {
      const result = await addToServerCart(product._id, qty, selectedSize, null);
      if (result?.success !== false) {
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
      }
    } else {
      addLocalItem(product, qty, selectedSize, null);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); return; }
    await userAPI.toggleWishlist(product._id);
    setWishlisted((w) => !w);
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!');
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to review'); return; }
    if (!reviewText.trim()) { toast.error('Please write a review'); return; }
    reviewMutation.mutate({ rating: reviewRating, comment: reviewText });
  };

  return (
    <div className="container-page py-6 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link to="/" className="hover:text-brand-500">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-brand-500">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${category}`} className="hover:text-brand-500">{category}</Link>
        <span>/</span>
        <span className="text-dark truncate">{name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ─── Image Gallery ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-50">
            <img
              src={images?.[selectedImage]?.url || ''}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Thumbnails */}
          {images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors
                    ${selectedImage === i ? 'border-brand-500' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Product Info ──────────────────────────────────────────────── */}
        <div className="space-y-5">
          <div>
            <p className="text-sm font-bold text-brand-500 uppercase tracking-widest">{brand}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark mt-1">{name}</h1>

            {/* Rating */}
            {numReviews > 0 && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 
                                 rounded-lg px-2.5 py-1">
                  <Star size={13} className="fill-green-600 text-green-600" />
                  <span className="text-sm font-bold text-green-700">{rating}</span>
                </div>
                <span className="text-sm text-muted">{numReviews} reviews</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-extrabold text-dark">
              ₹{effectivePrice.toLocaleString('en-IN')}
            </span>
            {discountPrice && (
              <>
                <span className="text-lg text-muted line-through mb-0.5">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                <span className="badge bg-green-100 text-green-700 mb-0.5">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>

          {/* Sizes */}
          {sizes?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Select Size</span>
                <button className="text-xs text-brand-500 underline">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map(({ size, stock: sizeStock }) => (
                  <button
                    key={size}
                    disabled={sizeStock === 0}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all
                      ${selectedSize === size
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : sizeStock === 0
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                          : 'border-gray-200 hover:border-gray-400 text-gray-700'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Qty:</span>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="px-4 py-2 text-sm font-semibold border-x border-gray-200 min-w-[40px] text-center">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(Math.min(10, stock), q + 1))}
                className="px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="text-xs text-muted">{stock} in stock</span>
          </div>

          {/* Stock warning */}
          {stock > 0 && stock <= 5 && (
            <p className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              ⚡ Only {stock} left — order soon!
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={stock === 0}
              className={`btn-primary flex-1 transition-all ${addedToCart ? 'bg-green-500 hover:bg-green-500' : ''}`}
            >
              {stock === 0 ? (
                'Out of Stock'
              ) : addedToCart ? (
                <><Check size={16} /> Added!</>
              ) : (
                <><ShoppingBag size={16} /> Add to Cart</>
              )}
            </button>
            <button
              onClick={handleWishlist}
              className="btn-outline px-4 flex-shrink-0"
              title="Add to wishlist"
            >
              <Heart
                size={18}
                className={wishlisted ? 'fill-brand-500 text-brand-500' : ''}
              />
            </button>
          </div>

          {/* Delivery info */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
            {[
              { icon: Truck, text: 'Free delivery on orders above ₹499' },
              { icon: RotateCcw, text: '30-day easy returns & exchanges' },
              { icon: Shield, text: '100% genuine products, secure payments' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-gray-600">
                <Icon size={15} className="text-brand-500 flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Reviews Section ────────────────────────────────────────────────── */}
      <section className="mt-14">
        <h2 className="section-title mb-6">Customer Reviews</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rating summary */}
          <div className="card p-6 text-center">
            <p className="text-5xl font-extrabold text-dark mb-1">{rating || 0}</p>
            <StarRating rating={rating || 0} size={18} />
            <p className="text-sm text-muted mt-2">{numReviews} reviews</p>
          </div>

          {/* Write review */}
          {isAuthenticated && (
            <div className="card p-6 lg:col-span-2">
              <h3 className="font-semibold mb-4">Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Star picker */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                    >
                      <Star
                        size={24}
                        className={
                          star <= (reviewHover || reviewRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200'
                        }
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={3}
                  className="input resize-none"
                />
                <button
                  type="submit"
                  disabled={reviewMutation.isLoading}
                  className="btn-primary text-sm"
                >
                  {reviewMutation.isLoading ? <Spinner size={14} /> : 'Submit Review'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Review list */}
        {reviews?.length > 0 && (
          <div className="mt-8 space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center 
                                   justify-center font-bold text-sm uppercase flex-shrink-0">
                    {review.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{review.name}</span>
                      <StarRating rating={review.rating} size={12} />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                    <p className="text-xs text-muted mt-1">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Related Products ──────────────────────────────────────────────── */}
      {related?.length > 0 && (
        <section className="mt-14">
          <h2 className="section-title mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.slice(0, 8).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
