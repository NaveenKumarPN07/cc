import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { authAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { EmptyState, Spinner } from '../components/common';

export default function WishlistPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['me-wishlist'],
    queryFn: () => authAPI.getMe(),
  });

  const wishlist = data?.user?.wishlist || [];

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="container-page py-8 animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-6">
        My Wishlist {wishlist.length > 0 && <span className="text-muted text-lg">({wishlist.length})</span>}
      </h1>
      {wishlist.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you love by tapping the heart icon on any product"
          action={<Link to="/products" className="btn-primary">Discover Products</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
