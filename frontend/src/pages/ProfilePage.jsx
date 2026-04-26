import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import { Spinner } from '../components/common';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile(form);
    if (result.success) toast.success('Profile updated!');
    else toast.error(result.message || 'Update failed');
  };

  return (
    <div className="container-page py-8 max-w-2xl animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-6">My Profile</h1>

      <div className="card p-6">
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

      <div className="grid grid-cols-2 gap-4 mt-5">
        <Link to="/orders" className="card p-4 text-center hover:shadow-card-hover transition-shadow">
          <p className="text-2xl font-bold text-brand-500">📦</p>
          <p className="font-semibold text-sm mt-1">My Orders</p>
        </Link>
        <Link to="/wishlist" className="card p-4 text-center hover:shadow-card-hover transition-shadow">
          <p className="text-2xl font-bold text-brand-500">❤️</p>
          <p className="font-semibold text-sm mt-1">Wishlist</p>
        </Link>
      </div>

      <div className="card p-5 mt-4">
        <p className="text-sm text-muted">
          Member since {new Date(user?.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long'
          })}
        </p>
      </div>
    </div>
  );
}
