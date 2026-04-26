/**
 * Common reusable components
 */

import { Loader2 } from 'lucide-react';

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-brand-500 ${className}`} />;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[3/4]"><Skeleton className="w-full h-full rounded-none" /></div>
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-24 mt-2" />
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon size={28} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Error Message ────────────────────────────────────────────────────────────
export function ErrorMessage({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
      {message}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (currentPage <= 3) return i + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + i;
    return currentPage - 2 + i;
  });

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn-ghost px-3 py-2 text-sm disabled:opacity-40"
      >
        ←
      </button>

      {pages[0] > 1 && (
        <>
          <PageBtn page={1} active={false} onClick={() => onPageChange(1)} />
          {pages[0] > 2 && <span className="px-2 text-muted">…</span>}
        </>
      )}

      {pages.map((p) => (
        <PageBtn key={p} page={p} active={p === currentPage} onClick={() => onPageChange(p)} />
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-2 text-muted">…</span>}
          <PageBtn page={totalPages} active={false} onClick={() => onPageChange(totalPages)} />
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn-ghost px-3 py-2 text-sm disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}

function PageBtn({ page, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
        ${active
          ? 'bg-brand-500 text-white'
          : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
      {page}
    </button>
  );
}

// ─── Star Rating ─────────────────────────────────────────────────────────────
import { Star } from 'lucide-react';

export function StarRating({ rating, max = 5, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i + 1 <= Math.round(rating);
        return (
          <Star
            key={i}
            size={size}
            className={filled ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
          />
        );
      })}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Processing: 'bg-blue-50 text-blue-700 border-blue-200',
  Shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  Delivered: 'bg-green-50 text-green-700 border-green-200',
  Cancelled: 'bg-red-50 text-red-600 border-red-200',
  Refunded: 'bg-gray-50 text-gray-600 border-gray-200',
};

export function OrderStatusBadge({ status }) {
  return (
    <span className={`badge border ${STATUS_COLORS[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
}
