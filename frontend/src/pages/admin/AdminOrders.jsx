// ─── AdminOrders.jsx ──────────────────────────────────────────────────────────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../services/api';
import { Spinner, OrderStatusBadge } from '../../components/common';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

export function AdminOrders() {
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders-list', { filterStatus, page }],
    queryFn: () => orderAPI.getAll({ status: filterStatus || undefined, page, limit: 20 }),
    keepPreviousData: true,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => orderAPI.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries(['admin-orders-list']);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-xl font-bold">Orders ({data?.total || 0})</h1>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="input py-2 text-sm w-auto"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Order', 'Customer', 'Total', 'Status', 'Update Status', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.orders?.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <Link to={`/orders/${order._id}`}
                        className="font-mono text-xs text-brand-600 hover:underline">
                        #{order._id.slice(-8).toUpperCase()}
                      </Link>
                      <p className="text-xs text-muted">{order.orderItems?.length} items</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{order.user?.name || 'Guest'}</p>
                      <p className="text-xs text-muted">{order.user?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold">
                      ₹{order.totalPrice?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={order.orderStatus} />
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) updateMutation.mutate({ id: order._id, status: e.target.value });
                          e.target.value = '';
                        }}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
                        disabled={['Delivered', 'Cancelled', 'Refunded'].includes(order.orderStatus)}
                      >
                        <option value="">Change to...</option>
                        {STATUS_OPTIONS.filter((s) => s !== order.orderStatus).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">
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
    </div>
  );
}

export default AdminOrders;
