// ─── OrdersPage ────────────────────────────────────────────────────────────────
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { orderAPI } from '../services/api';
import { Spinner, EmptyState, OrderStatusBadge } from '../components/common';

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderAPI.getMyOrders({ limit: 20 }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="container-page py-8 max-w-3xl animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-6">My Orders</h1>

      {!data?.orders?.length ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Your order history will appear here"
          action={<Link to="/products" className="btn-primary">Start Shopping</Link>}
        />
      ) : (
        <div className="space-y-4">
          {data.orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <span className="font-mono text-xs text-muted">#{order._id.slice(-8).toUpperCase()}</span>
                  <OrderStatusBadge status={order.orderStatus} />
                </div>
                <p className="text-sm text-gray-600">
                  {order.orderItems?.length} item(s) · ₹{order.totalPrice?.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {order.orderItems?.slice(0, 3).map((item, i) => (
                    <img
                      key={i}
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-12 object-cover rounded border-2 border-white"
                    />
                  ))}
                </div>
                <ChevronRight size={18} className="text-muted flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
