// ─── LoginPage ────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import useAuthStore from '../context/authStore';
import { Spinner } from '../components/common';
import toast from 'react-hot-toast';

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const redirect = params.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form);
    if (result.success) {
      toast.success('Welcome back!');
      navigate(redirect);
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
          <h2 className="mt-4 font-display text-2xl font-bold text-dark">Welcome back</h2>
          <p className="text-sm text-muted mt-1">Sign in to your account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="input pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
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

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? <Spinner size={16} /> : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-600">Demo credentials:</p>
            <p>Admin: <span className="font-mono">admin@ajio.com</span> / <span className="font-mono">Admin@123</span></p>
            <p>User: <span className="font-mono">user@ajio.com</span> / <span className="font-mono">User@123</span></p>
          </div>

          <p className="text-center text-sm text-muted mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-500 font-semibold hover:text-brand-600">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
