/**
 * RecommendedProducts.jsx
 * ────────────────────────
 * Drops into HomePage or anywhere in the app.
 * Shows personalized results for logged-in users, popular for guests.
 *
 * Usage:
 *   import RecommendedProducts from '../components/product/RecommendedProducts';
 *   <RecommendedProducts />
 */

import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp } from 'lucide-react';
import useAuthStore from '../../context/authStore';
import { useRecommendations, usePopularProducts } from '../../hooks/useRecommendations';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common';

export default function RecommendedProducts({ limit = 8 }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  // Personalized for logged-in, popular for guests
  const personalQuery  = useRecommendations(limit);
  const popularQuery   = usePopularProducts(limit);

  const activeQuery = isAuthenticated ? personalQuery : popularQuery;
  const { data, isLoading, isError } = activeQuery;

  const products = data?.products || [];
  const isPersonalized = isAuthenticated && data?.source === 'svd';

  if (isError) return null; // Silent fail — don't break the page

  return (
    <section className="container-page py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {isPersonalized ? (
            <Sparkles size={20} className="text-brand-500" />
          ) : (
            <TrendingUp size={20} className="text-brand-500" />
          )}
          <h2 className="section-title">
            {isPersonalized ? 'Recommended for You' : 'Trending Now'}
          </h2>
        </div>
        <Link
          to="/products"
          className="text-sm font-semibold text-brand-500 hover:text-brand-600"
        >
          See all →
        </Link>
      </div>

      {/* Source badge (subtle) */}
      {isAuthenticated && data?.source && (
        <p className="text-xs text-muted mb-4 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          {isPersonalized
            ? 'Personalised based on your activity'
            : 'Popular picks · sign in for personal recommendations'}
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array(limit).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
      </div>

      {/* Empty state */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-10 text-muted text-sm">
          No recommendations available yet. Start shopping to personalize your feed!
        </div>
      )}
    </section>
  );
}
