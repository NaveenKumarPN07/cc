import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { orderAPI, productAPI, userAPI } from '../../services/api';
import { Spinner, OrderStatusBadge } from '../../components/common';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="text-2xl font-extrabold text-dark mt-1">{value}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => orderAPI.getAll({ limit: 10 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products-count'],
    queryFn: () => productAPI.getAll({ limit: 1 }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-count'],
    queryFn: () => userAPI.getAll({ limit: 1 }),
  });

  // Compute stats from orders
  const stats = ordersData?.stats || [];
  const totalRevenue = stats.reduce((s, st) => s + (st._id !== 'Cancelled' ? st.revenue : 0), 0);
  const totalOrders = ordersData?.total || 0;
  const pendingOrders = stats.find((s) => s._id === 'Pending')?.count || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">Dashboard Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign} label="Total Revenue"
          value={`₹${(totalRevenue / 1000).toFixed(1)}K`}
          sub="Excluding cancelled orders" color="bg-green-500"
        />
        <StatCard
          icon={ShoppingCart} label="Total Orders"
          value={totalOrders}
          sub={`${pendingOrders} pending`} color="bg-brand-500"
        />
        <StatCard
          icon={Package} label="Products"
          value={productsData?.total || '—'}
          sub="Active listings" color="bg-purple-500"
        />
        <StatCard
          icon={Users} label="Users"
          value={usersData?.total || '—'}
          sub="Registered accounts" color="bg-indigo-500"
        />
      </div>

      {/* Status breakdown */}
      {stats.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-500" /> Order Status Breakdown
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].map((status) => {
              const s = stats.find((st) => st._id === status);
              return (
                <div key={status} className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xl font-bold text-dark">{s?.count || 0}</p>
                  <OrderStatusBadge status={status} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent orders table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock size={16} className="text-brand-500" /> Recent Orders
          </h2>
          <Link to="/admin/orders" className="text-sm text-brand-500 font-semibold hover:text-brand-600">
            View All →
          </Link>
        </div>

        {loadingOrders ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ordersData?.orders?.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link to={`/orders/${order._id}`}
                        className="font-mono text-xs text-brand-600 hover:underline">
                        #{order._id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      {order.user?.name || 'Guest'}
                      <p className="text-xs text-muted">{order.user?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{order.orderItems?.length} item(s)</td>
                    <td className="px-5 py-3.5 font-semibold">
                      ₹{order.totalPrice?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={order.orderStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-muted text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/admin/products/new', label: 'Add New Product', icon: Package, color: 'text-purple-600 bg-purple-50' },
          { to: '/admin/orders', label: 'Manage Orders', icon: ShoppingCart, color: 'text-brand-600 bg-brand-50' },
          { to: '/admin/users', label: 'Manage Users', icon: Users, color: 'text-indigo-600 bg-indigo-50' },
        ].map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to}
            className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <span className="font-semibold text-sm">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
