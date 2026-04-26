// ─── OrderSuccessPage ─────────────────────────────────────────────────────────
import { Link, useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export function OrderSuccessPage() {
  const { id } = useParams();
  return (
    <div className="container-page py-20 text-center animate-fade-in">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="font-display text-3xl font-bold text-dark mb-3">Order Placed!</h1>
        <p className="text-muted mb-2">
          Your order <span className="font-mono font-semibold text-dark">#{id?.slice(-8).toUpperCase()}</span> has been confirmed.
        </p>
        <p className="text-sm text-muted mb-8">
          You'll receive a confirmation shortly. We'll keep you updated on shipping.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to={`/orders/${id}`} className="btn-outline">Track Order</Link>
          <Link to="/products" className="btn-primary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────
import { useState } from 'react';
import useAuthStore from '../context/authStore';
import { Spinner } from '../components/common';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile(form);
    if (result.success) toast.success('Profile updated!');
    else toast.error(result.message);
  };

  return (
    <div className="container-page py-8 max-w-2xl animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-6">My Profile</h1>

      <div className="card p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center 
                           justify-center text-2xl font-bold uppercase">
            {user?.name?.[0]}
          </div>
          <div>
            <p className="font-semibold text-dark">{user?.name}</p>
            <p className="text-sm text-muted">{user?.email}</p>
            <span className={`badge mt-1 ${user?.role === 'admin'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={user?.email} className="input bg-gray-50" disabled />
            <p className="text-xs text-muted mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="10-digit mobile number"
              className="input"
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? <Spinner size={16} /> : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="card p-5 mt-5">
        <p className="text-sm text-muted">
          Member since {new Date(user?.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
        </p>
      </div>
    </div>
  );
}

// ─── WishlistPage ─────────────────────────────────────────────────────────────
import { useQuery } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import ProductCard from "../components/product/ProductCard";
import { Heart } from 'lucide-react';
import { EmptyState } from '../components/common';

// Wishlist is embedded in user profile
export function WishlistPage() {
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
          description="Save items you love by tapping the heart icon"
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

// ─── NotFoundPage ─────────────────────────────────────────────────────────────
export function NotFoundPage() {
  return (
    <div className="container-page py-20 text-center animate-fade-in">
      <p className="font-display text-8xl font-extrabold text-brand-100 mb-4">404</p>
      <h1 className="font-display text-3xl font-bold text-dark mb-3">Page Not Found</h1>
      <p className="text-muted mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary">Go Home</Link>
    </div>
  );
}

export default OrderSuccessPage;
