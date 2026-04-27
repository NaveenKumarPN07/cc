/**
 * SimilarProducts.jsx
 * ────────────────────
 * "You may also like" section on ProductDetailPage.
 *
 * Replace the existing related products section:
 *   <SimilarProducts productId={product._id} />
 */

import { useSimilarProducts } from '../../hooks/useRecommendations';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common';

export default function SimilarProducts({ productId, limit = 8 }) {
  const { data, isLoading, isError } = useSimilarProducts(productId, limit);
  const products = data?.products || [];

  if (isError || (!isLoading && products.length === 0)) return null;

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">You May Also Like</h2>
        <span className="text-xs text-muted bg-gray-50 px-2 py-1 rounded-full">
          {data?.source === 'svd_cosine' ? '✦ AI-powered' : 'Similar items'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array(limit).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </section>
  );
}
