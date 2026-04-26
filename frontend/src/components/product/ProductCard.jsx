import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import { userAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import useCartStore from '../../context/cartStore';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const addToServerCart = useCartStore((s) => s.addToServerCart);
  const addLocalItem = useCartStore((s) => s.addLocalItem);

  const { _id, name, brand, images, price, discountPrice, rating, numReviews, category } = product;
  const img = images?.[0]?.url || 'https://via.placeholder.com/400x500?text=No+Image';
  const discount = discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const effectivePrice = discountPrice || price;

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to save items'); return; }
    try {
      await userAPI.toggleWishlist(_id);
      setWishlisted((w) => !w);
      toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch { toast.error('Failed to update wishlist'); }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      await addToServerCart(_id, 1, null, null);
    } else {
      addLocalItem(product, 1, null, null);
    }
  };

  return (
    <Link to={`/products/${_id}`} className="product-card block">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        <img
          src={imgError ? 'https://via.placeholder.com/400x500?text=No+Image' : img}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgError(true)}
          loading="lazy"
        />

        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 badge bg-brand-500 text-white text-[11px]">
            {discount}% OFF
          </span>
        )}

        {/* Actions overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 
                         transition-opacity duration-200">
          <button
            onClick={handleWishlist}
            className="w-8 h-8 bg-white rounded-full shadow-card flex items-center justify-center 
                        hover:bg-brand-50 transition-colors"
            title="Add to wishlist"
          >
            <Heart
              size={14}
              className={wishlisted ? 'fill-brand-500 text-brand-500' : 'text-gray-500'}
            />
          </button>
        </div>

        {/* Quick add button */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 
                         transition-transform duration-200">
          <button
            onClick={handleQuickAdd}
            className="w-full bg-dark text-white text-xs font-semibold py-2.5 flex items-center 
                        justify-center gap-2 hover:bg-brand-500 transition-colors"
          >
            <ShoppingBag size={13} /> Quick Add
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-semibold text-brand-500 uppercase tracking-wide mb-0.5">{brand}</p>
        <p className="text-sm text-gray-800 font-medium line-clamp-2 leading-snug">{name}</p>

        {/* Price */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-dark">
            ₹{effectivePrice.toLocaleString('en-IN')}
          </span>
          {discountPrice && (
            <span className="text-xs text-muted line-through">
              ₹{price.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Rating */}
        {numReviews > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <div className="flex items-center gap-0.5 bg-green-50 border border-green-200 
                             rounded px-1.5 py-0.5">
              <Star size={10} className="fill-green-600 text-green-600" />
              <span className="text-[11px] font-semibold text-green-700">{rating}</span>
            </div>
            <span className="text-xs text-muted">({numReviews})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
