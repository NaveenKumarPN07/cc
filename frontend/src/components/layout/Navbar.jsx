import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag, Search, Heart, User, Menu, X, ChevronDown, LogOut, Package, Settings,
} from 'lucide-react';
import useAuthStore from '../../context/authStore';
import useCartStore from '../../context/cartStore';

const CATEGORIES = ['Men', 'Women', 'Kids', 'Footwear', 'Accessories', 'Sports', 'Beauty', 'Electronics'];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { user, logout, isAuthenticated, isAdmin } = useAuthStore((s) => ({
    user: s.user,
    logout: s.logout,
    isAuthenticated: s.isAuthenticated(),
    isAdmin: s.isAdmin(),
  }));

  const totalItems = useCartStore((s) => s.totalItems);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container-page">
        <div className="flex items-center h-16 gap-4">

          {/* Mobile menu button */}
          <button
            className="lg:hidden btn-ghost p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="font-display text-2xl font-extrabold text-brand-500 tracking-tight">
              AJIO
            </span>
            <span className="font-display text-2xl font-extrabold text-dark tracking-tight">
              .clone
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-4 flex-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/products?category=${cat}`}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-500 
                           hover:bg-brand-50 rounded-lg transition-colors whitespace-nowrap"
              >
                {cat}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 animate-slide-down">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search brands, products..."
                  className="input w-48 sm:w-72 py-2 text-sm"
                />
                <button type="submit" className="btn-ghost p-2">
                  <Search size={18} />
                </button>
                <button type="button" onClick={() => setSearchOpen(false)} className="btn-ghost p-2">
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="btn-ghost p-2"
                aria-label="Search"
              >
                <Search size={20} />
              </button>
            )}

            {/* Wishlist */}
            {isAuthenticated && (
              <Link to="/wishlist" className="btn-ghost p-2 hidden sm:flex" aria-label="Wishlist">
                <Heart size={20} />
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="btn-ghost p-2 relative" aria-label="Cart">
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-500 text-white text-[10px] 
                                  font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="btn-ghost p-2 gap-1.5 hidden sm:flex items-center"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center 
                                   justify-center text-sm font-bold uppercase">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-card-hover 
                                   border border-gray-100 py-2 animate-slide-down z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="font-semibold text-sm text-dark truncate">{user?.name}</p>
                      <p className="text-xs text-muted truncate">{user?.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <User size={16} className="text-muted" /> My Profile
                    </Link>
                    <Link to="/orders" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Package size={16} className="text-muted" /> My Orders
                    </Link>
                    <Link to="/wishlist" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Heart size={16} className="text-muted" /> Wishlist
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50">
                        <Settings size={16} /> Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 
                                 hover:bg-red-50 w-full"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm py-2 hidden sm:flex">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4 hidden sm:flex">
                  Register
                </Link>
                <Link to="/login" className="btn-ghost p-2 sm:hidden">
                  <User size={20} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white animate-slide-down">
          <div className="container-page py-3 grid grid-cols-3 gap-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/products?category=${cat}`}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-brand-500 
                           hover:bg-brand-50 rounded-lg transition-colors text-center"
              >
                {cat}
              </Link>
            ))}
          </div>
          {isAuthenticated && (
            <div className="container-page pb-3 flex gap-2">
              <Link to="/profile" onClick={() => setMenuOpen(false)}
                className="btn-ghost text-sm flex-1 justify-center">
                Profile
              </Link>
              <Link to="/orders" onClick={() => setMenuOpen(false)}
                className="btn-ghost text-sm flex-1 justify-center">
                Orders
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm text-red-500 flex-1 justify-center">
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
