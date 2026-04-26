import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import useCartStore from '../context/cartStore';
import useAuthStore from '../context/authStore';
import { EmptyState } from '../components/common';
import { Spinner } from '../components/common';

function CartItem({ item, onUpdate, onRemove, isServer }) {
  const { name, image, price, quantity, size, color } = item;
  const id = isServer ? item._id : `${item.product._id}-${item.size}-${item.color}`;
  const productId = isServer ? item.product?._id : item.product._id;

  return (
    <div className="flex gap-4 py-5 border-b border-gray-100 last:border-0">
      {/* Image */}
      <Link to={`/products/${productId}`} className="flex-shrink-0">
        <img
          src={image || item.product?.images?.[0]?.url}
          alt={name}
          className="w-24 h-32 object-cover rounded-xl bg-gray-50"
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link to={`/products/${productId}`}>
          <h3 className="font-semibold text-sm text-dark hover:text-brand-500 transition-colors line-clamp-2">
            {name}
          </h3>
        </Link>
        <div className="flex flex-wrap gap-2 mt-1">
          {size && <span className="text-xs text-muted bg-gray-50 px-2 py-0.5 rounded">Size: {size}</span>}
          {color && <span className="text-xs text-muted bg-gray-50 px-2 py-0.5 rounded">Color: {color}</span>}
        </div>

        <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
          {/* Qty controls */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdate(id, quantity - 1, productId, size, color)}
              className="px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
              disabled={quantity <= 1}
            >
              <Minus size={13} />
            </button>
            <span className="px-3 text-sm font-semibold border-x border-gray-200 min-w-[30px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => onUpdate(id, quantity + 1, productId, size, color)}
              className="px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
              disabled={quantity >= 10}
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-bold text-dark">
              ₹{(price * quantity).toLocaleString('en-IN')}
            </span>
            <button
              onClick={() => onRemove(id, productId, size, color)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const {
    items, serverCart, isLoading,
    updateLocalQuantity, removeLocalItem,
    updateServerItem, removeServerItem,
    getLocalSubtotal,
  } = useCartStore();

  const isServer = isAuthenticated;
  const cartItems = isServer ? (serverCart?.items || []) : items;
  const isEmpty = cartItems.length === 0;

  const subtotal = isServer
    ? (serverCart?.subtotal || 0)
    : getLocalSubtotal();

  const shipping = subtotal >= 499 ? 0 : 49;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  const handleUpdate = (id, newQty, productId, size, color) => {
    if (newQty < 1) return;
    if (isServer) updateServerItem(id, newQty);
    else updateLocalQuantity(productId, size, color, newQty);
  };

  const handleRemove = (id, productId, size, color) => {
    if (isServer) removeServerItem(id);
    else removeLocalItem(productId, size, color);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-6">
        Shopping Cart {!isEmpty && <span className="text-muted text-lg">({cartItems.length} items)</span>}
      </h1>

      {isEmpty ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Explore our products!"
          action={
            <Link to="/products" className="btn-primary">
              Start Shopping
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 card p-4 sm:p-6">
            {cartItems.map((item) => (
              <CartItem
                key={item._id || `${item.product._id}-${item.size}-${item.color}`}
                item={item}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
                isServer={isServer}
              />
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Tag size={15} className="text-brand-500" /> Apply Coupon
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  className="input flex-1 text-sm py-2"
                />
                <button className="btn-outline text-sm py-2 px-4">Apply</button>
              </div>
              <p className="text-xs text-muted mt-2">Try: WELCOME20 for 20% off</p>
            </div>

            {/* Price breakdown */}
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold">Order Summary</h3>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span>₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-dark text-base">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {shipping > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  Add ₹{(499 - subtotal).toLocaleString('en-IN')} more for free shipping!
                </p>
              )}

              <button
                onClick={() => {
                  if (!isAuthenticated) navigate('/login?redirect=/checkout');
                  else navigate('/checkout');
                }}
                className="btn-primary w-full mt-1"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>

              {!isAuthenticated && (
                <p className="text-xs text-center text-muted">
                  <Link to="/login" className="text-brand-500 font-semibold">Sign in</Link> to save your cart
                </p>
              )}
            </div>

            {/* Continue shopping */}
            <Link to="/products" className="btn-ghost w-full justify-center text-sm">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
