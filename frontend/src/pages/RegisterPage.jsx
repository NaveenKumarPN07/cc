import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import useAuthStore from '../context/authStore';
import { Spinner } from '../components/common';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const result = await register(form);
    if (result.success) {
      toast.success('Account created! Welcome to AJIO Clone 🎉');
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <span className="font-display text-4xl font-extrabold text-brand-500">AJIO</span>
            <span className="font-display text-4xl font-extrabold text-dark">.clone</span>
          </Link>
          <h2 className="mt-4 font-display text-2xl font-bold text-dark">Create an account</h2>
          <p className="text-sm text-muted mt-1">Join millions of shoppers</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Doe', Icon: User },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com', Icon: Mail },
              { label: 'Phone (optional)', key: 'phone', type: 'tel', placeholder: '10-digit mobile', Icon: Phone },
            ].map(({ label, key, type, placeholder, Icon }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <div className="relative">
                  <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type={type}
                    value={form[key]}
                    onChange={set(key)}
                    placeholder={placeholder}
                    className="input pl-9"
                    required={key !== 'phone'}
                  />
                </div>
              </div>
            ))}

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 6 characters"
                  className="input pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-dark"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <p className="text-xs text-muted">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-brand-500 underline">Terms</a> and{' '}
              <a href="#" className="text-brand-500 underline">Privacy Policy</a>.
            </p>

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? <Spinner size={16} /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
