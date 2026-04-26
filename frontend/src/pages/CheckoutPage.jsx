import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CreditCard, Smartphone, Landmark, Banknote, MapPin } from 'lucide-react';
import { orderAPI } from '../services/api';
import useCartStore from '../context/cartStore';
import useAuthStore from '../context/authStore';
import { Spinner, ErrorMessage } from '../components/common';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'COD', label: 'Cash on Delivery', icon: Banknote },
  { id: 'Card', label: 'Credit / Debit Card', icon: CreditCard },
  { id: 'UPI', label: 'UPI Payment', icon: Smartphone },
  { id: 'NetBanking', label: 'Net Banking', icon: Landmark },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { serverCart, fetchCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [errors, setErrors] = useState({});

  const subtotal = serverCart?.subtotal || 0;
  const shipping = subtotal >= 499 ? 0 : 49;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  const validate = () => {
    const e = {};
    if (!address.fullName.trim()) e.fullName = 'Full name is required';
    if (!address.phone.trim() || !/^\d{10}$/.test(address.phone)) e.phone = 'Valid 10-digit phone required';
    if (!address.street.trim()) e.street = 'Street address is required';
    if (!address.city.trim()) e.city = 'City is required';
    if (!address.state.trim()) e.state = 'State is required';
    if (!address.postalCode.trim() || !/^\d{6}$/.test(address.postalCode)) e.postalCode = 'Valid 6-digit PIN required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const orderMutation = useMutation({
    mutationFn: (data) => orderAPI.place(data),
    onSuccess: async (data) => {
      await fetchCart();
      toast.success('Order placed successfully! 🎉');
      navigate(`/order-success/${data.order._id}`);
    },
    onError: (err) => toast.error(err.message || 'Failed to place order'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!serverCart?.items?.length) {
      toast.error('Your cart is empty');
      return;
    }
    orderMutation.mutate({ shippingAddress: address, paymentMethod });
  };

  const Field = ({ label, name, type = 'text', placeholder, half }) => (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label className="label">{label}</label>
      <input
        type={type}
        value={address[name]}
        onChange={(e) => setAddress((a) => ({ ...a, [name]: e.target.value }))}
        placeholder={placeholder}
        className={`input ${errors[name] ? 'input-error' : ''}`}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="container-page py-8 max-w-5xl animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Address + Payment */}
          <div className="lg:col-span-2 space-y-6">

            {/* Shipping Address */}
            <div className="card p-6">
              <h2 className="font-semibold flex items-center gap-2 mb-5">
                <MapPin size={18} className="text-brand-500" /> Shipping Address
              </h2>

              {/* Saved addresses */}
              {user?.addresses?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs text-muted mb-2 font-medium">Saved Addresses</p>
                  <div className="space-y-2">
                    {user.addresses.map((addr) => (
                      <button
                        key={addr._id}
                        type="button"
                        onClick={() =>
                          setAddress({
                            fullName: user.name,
                            phone: user.phone || '',
                            street: addr.street,
                            city: addr.city,
                            state: addr.state,
                            postalCode: addr.postalCode,
                            country: addr.country,
                          })
                        }
                        className="w-full text-left p-3 border border-gray-200 rounded-lg 
                                    text-sm hover:border-brand-400 transition-colors"
                      >
                        <p className="font-medium">{addr.street}, {addr.city}</p>
                        <p className="text-muted text-xs">{addr.state} - {addr.postalCode}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted mt-2">Or fill in a new address:</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name *" name="fullName" placeholder="John Doe" />
                <Field label="Phone *" name="phone" placeholder="10-digit mobile" half />
                <Field label="Street Address *" name="street" placeholder="House no, Street, Area" />
                <Field label="City *" name="city" placeholder="Mumbai" half />
                <Field label="State *" name="state" placeholder="Maharashtra" half />
                <Field label="PIN Code *" name="postalCode" placeholder="400001" half />
              </div>
            </div>

            {/* Payment Method */}
            <div className="card p-6">
              <h2 className="font-semibold mb-4">Payment Method</h2>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                  <label
                    key={id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${paymentMethod === id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-100 hover:border-gray-200'
                      }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={id}
                      checked={paymentMethod === id}
                      onChange={() => setPaymentMethod(id)}
                      className="accent-brand-500"
                    />
                    <Icon size={20} className={paymentMethod === id ? 'text-brand-500' : 'text-gray-400'} />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      {id === 'COD' && (
                        <p className="text-xs text-muted">Pay when your order arrives</p>
                      )}
                      {id === 'Card' && (
                        <p className="text-xs text-muted">Visa, Mastercard, Amex accepted</p>
                      )}
                      {id !== 'COD' && id !== 'Card' && (
                        <p className="text-xs text-amber-600">Mock integration — no real payment</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order summary */}
          <div>
            <div className="card p-5 sticky top-24">
              <h2 className="font-semibold mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-52 overflow-y-auto pr-1">
                {serverCart?.items?.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-14 object-cover rounded-lg bg-gray-50 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2">{item.name}</p>
                      {item.size && <p className="text-xs text-muted">Size: {item.size}</p>}
                      <p className="text-xs font-semibold">
                        ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span><span>₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-dark">
                  <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={orderMutation.isLoading}
                className="btn-primary w-full mt-5"
              >
                {orderMutation.isLoading ? (
                  <><Spinner size={16} /> Placing Order...</>
                ) : (
                  `Place Order — ₹${total.toLocaleString('en-IN')}`
                )}
              </button>

              <p className="text-xs text-center text-muted mt-3">
                🔒 Secure checkout. Your data is protected.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
