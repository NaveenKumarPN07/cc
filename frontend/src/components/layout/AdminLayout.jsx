import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Menu, X, LogOut, ExternalLink,
} from 'lucide-react';
import useAuthStore from '../../context/authStore';

const NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/users', icon: Users, label: 'Users' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isActive = (item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-extrabold text-brand-400">AJIO</span>
          <span className="text-xs font-semibold text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
            ADMIN
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
              ${isActive(item)
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 
                      hover:text-white hover:bg-gray-800 transition-colors"
        >
          <ExternalLink size={16} /> View Store
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 
                      hover:text-red-300 hover:bg-gray-800 transition-colors w-full"
        >
          <LogOut size={16} /> Sign Out
        </button>
        <div className="px-4 py-2">
          <p className="text-xs text-gray-500 truncate">{user?.name}</p>
          <p className="text-xs text-gray-600 truncate">{user?.email}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-gray-900 flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-gray-900 flex flex-col z-10 animate-slide-up">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden btn-ghost p-2"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-gray-800">
            {NAV_ITEMS.find((i) => isActive(i))?.label || 'Admin'}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center 
                             justify-center text-sm font-bold uppercase">
              {user?.name?.[0]}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
