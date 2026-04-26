import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { productAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton, Pagination, EmptyState } from '../components/common';
import { ShoppingBag } from 'lucide-react';

const CATEGORIES = ['Men', 'Women', 'Kids', 'Footwear', 'Accessories', 'Sports', 'Beauty', 'Electronics'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];
const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 – ₹2,000', min: 1000, max: 2000 },
  { label: '₹2,000 – ₹5,000', min: 2000, max: 5000 },
  { label: 'Above ₹5,000', min: 5000, max: 999999 },
];

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="font-semibold text-sm text-dark">{title}</span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && children}
    </div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Read filters from URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (search) next.set('search', search);
    setSearchParams(next);
  };

  const hasFilters = category || minPrice || maxPrice;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', { search, category, sort, minPrice, maxPrice, page }],
    queryFn: () =>
      productAPI.getAll({
        search: search || undefined,
        category: category || undefined,
        sort,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        page,
        limit: 12,
      }),
    keepPreviousData: true,
  });

  const Filters = () => (
    <div className="space-y-0">
      {/* Category */}
      <FilterSection title="Category">
        <div className="space-y-2">
          <button
            onClick={() => updateParam('category', '')}
            className={`block w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors
              ${!category ? 'text-brand-600 font-semibold bg-brand-50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => updateParam('category', cat)}
              className={`block w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors
                ${category === cat ? 'text-brand-600 font-semibold bg-brand-50' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="space-y-2">
          {PRICE_RANGES.map(({ label, min, max }) => {
            const active = minPrice === String(min) && maxPrice === String(max);
            return (
              <button
                key={label}
                onClick={() => {
                  if (active) {
                    updateParam('minPrice', '');
                    updateParam('maxPrice', '');
                  } else {
                    const next = new URLSearchParams(searchParams);
                    next.set('minPrice', min);
                    next.set('maxPrice', max);
                    next.delete('page');
                    setSearchParams(next);
                  }
                }}
                className={`block w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors
                  ${active ? 'text-brand-600 font-semibold bg-brand-50' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div className="container-page py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark">
            {category || (search ? `"${search}"` : 'All Products')}
          </h1>
          {data && (
            <p className="text-sm text-muted mt-0.5">{data.total} products found</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="input py-2 text-sm w-auto"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setFiltersOpen(true)}
            className="btn-outline py-2 text-sm lg:hidden flex items-center gap-2"
          >
            <SlidersHorizontal size={15} /> Filters
            {hasFilters && (
              <span className="w-2 h-2 bg-brand-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-5">
          {category && (
            <span className="badge bg-brand-50 text-brand-600 border border-brand-200 gap-1.5">
              {category}
              <button onClick={() => updateParam('category', '')}><X size={12} /></button>
            </span>
          )}
          {(minPrice || maxPrice) && (
            <span className="badge bg-brand-50 text-brand-600 border border-brand-200 gap-1.5">
              ₹{minPrice}–₹{maxPrice}
              <button onClick={() => { updateParam('minPrice', ''); updateParam('maxPrice', ''); }}>
                <X size={12} />
              </button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-muted hover:text-dark underline">
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop sidebar filters */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <Filters />
        </aside>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {isError ? (
            <div className="text-center py-20 text-red-500">Failed to load products. Please try again.</div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : data?.products?.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No products found"
              description="Try adjusting your filters or search query"
              action={
                <button onClick={clearFilters} className="btn-primary text-sm">
                  Clear Filters
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {data.products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              <Pagination
                currentPage={page}
                totalPages={data.totalPages}
                onPageChange={(p) => updateParam('page', p)}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white p-5 overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setFiltersOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <Filters />
            <button
              onClick={() => setFiltersOpen(false)}
              className="btn-primary w-full mt-4"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
