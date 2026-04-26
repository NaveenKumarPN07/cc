import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, MapPin, CreditCard, Package } from 'lucide-react';
import { orderAPI } from '../services/api';
import { Spinner, OrderStatusBadge } from '../components/common';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOne(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderAPI.cancel(id, { reason: 'Cancelled by user' }),
    onSuccess: () => {
      toast.success('Order cancelled');
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['my-orders']);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  const order = data?.order;
  if (!order) return <div className="container-page py-20 text-center text-gray-500">Order not found</div>;

  const { orderItems, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice, orderStatus } = order;
  const currentStep = STATUS_STEPS.indexOf(orderStatus);
  const canCancel = ['Pending', 'Processing'].includes(orderStatus);

  return (
    <div className="container-page py-8 max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-xl font-bold">
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <OrderStatusBadge status={orderStatus} />
          {canCancel && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isLoading}
              className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 
                          hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {cancelMutation.isLoading ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Progress tracker */}
      {orderStatus !== 'Cancelled' && orderStatus !== 'Refunded' && (
        <div className="card p-6 mb-5">
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                    ${i <= currentStep ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${i <= currentStep ? 'text-brand-600' : 'text-muted'}`}>
                    {step}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < currentStep ? 'bg-brand-500' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* Items */}
        <div className="card p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Package size={16} className="text-brand-500" /> Order Items
          </h2>
          <div className="space-y-4">
            {orderItems.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <img src={item.image} alt={item.name}
                  className="w-16 h-20 object-cover rounded-xl bg-gray-50 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product}`}
                    className="text-sm font-semibold hover:text-brand-500 line-clamp-2">{item.name}</Link>
                  {item.size && <p className="text-xs text-muted">Size: {item.size}</p>}
                  <p className="text-xs text-muted mt-0.5">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-sm flex-shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Shipping */}
          <div className="card p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-brand-500" /> Shipping Address
            </h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-semibold text-dark">{shippingAddress.fullName}</p>
              <p>{shippingAddress.street}</p>
              <p>{shippingAddress.city}, {shippingAddress.state} – {shippingAddress.postalCode}</p>
              <p>{shippingAddress.country}</p>
              <p className="mt-1">📞 {shippingAddress.phone}</p>
            </div>
          </div>

          {/* Payment + Price */}
          <div className="card p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <CreditCard size={16} className="text-brand-500" /> Payment Details
            </h2>
            <div className="text-sm space-y-2 text-gray-600">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="font-medium text-dark">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Items total</span>
                <span>₹{itemsPrice?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}</span>
              </div>
              <div className="flex justify-between">
                <span>GST</span>
                <span>₹{taxPrice?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-dark border-t border-gray-100 pt-2 mt-1">
                <span>Total</span>
                <span>₹{totalPrice?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
