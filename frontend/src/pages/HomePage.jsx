import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RotateCcw, Shield, Headphones } from 'lucide-react';
import { productAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common';

const HERO_SLIDES = [
  {
    title: 'New Season Arrivals',
    subtitle: 'Discover the latest trends in fashion',
    cta: 'Shop Now',
    link: '/products',
    bg: 'from-brand-500 to-brand-700',
    emoji: '👗',
  },
  {
    title: 'Big Brand Sale',
    subtitle: 'Up to 70% off on top brands',
    cta: 'Grab Deals',
    link: '/products?sort=price_asc',
    bg: 'from-purple-600 to-indigo-700',
    emoji: '🛍️',
  },
  {
    title: 'Sports & Fitness',
    subtitle: 'Gear up for your best performance',
    cta: 'Explore Sports',
    link: '/products?category=Sports',
    bg: 'from-emerald-500 to-teal-700',
    emoji: '🏃',
  },
];

const CATEGORIES = [
  { name: 'Men', emoji: '👔', color: 'bg-blue-50 text-blue-700' },
  { name: 'Women', emoji: '👗', color: 'bg-pink-50 text-pink-700' },
  { name: 'Kids', emoji: '🎒', color: 'bg-yellow-50 text-yellow-700' },
  { name: 'Footwear', emoji: '👟', color: 'bg-purple-50 text-purple-700' },
  { name: 'Accessories', emoji: '👜', color: 'bg-orange-50 text-orange-700' },
  { name: 'Sports', emoji: '🏋️', color: 'bg-green-50 text-green-700' },
  { name: 'Beauty', emoji: '💄', color: 'bg-rose-50 text-rose-700' },
  { name: 'Electronics', emoji: '🎧', color: 'bg-indigo-50 text-indigo-700' },
];

const PROMISES = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹499' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: Shield, title: 'Secure Payments', desc: '100% safe checkout' },
  { icon: Headphones, title: '24/7 Support', desc: 'Dedicated customer care' },
];

export default function HomePage() {
  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productAPI.getAll({ isFeatured: true, limit: 8 }),
  });

  const { data: newArrivalsData, isLoading: loadingNew } = useQuery({
    queryKey: ['products', 'newest'],
    queryFn: () => productAPI.getAll({ sort: 'newest', limit: 8 }),
  });

  return (
    <div className="animate-fade-in">

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="container-page py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {HERO_SLIDES.map((slide, i) => (
            <Link
              key={i}
              to={slide.link}
              className={`relative rounded-2xl bg-gradient-to-br ${slide.bg} p-8 text-white 
                          overflow-hidden group cursor-pointer
                          ${i === 0 ? 'lg:col-span-2 lg:row-span-1' : ''}`}
            >
              <div className="relative z-10">
                <p className="text-sm font-medium opacity-80 mb-1">Limited Time</p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2 text-balance">
                  {slide.title}
                </h2>
                <p className="text-sm opacity-80 mb-6">{slide.subtitle}</p>
                <span className="inline-flex items-center gap-2 bg-white text-gray-900 
                                  font-semibold text-sm px-5 py-2.5 rounded-full
                                  group-hover:gap-3 transition-all">
                  {slide.cta} <ArrowRight size={15} />
                </span>
              </div>
              <div className="absolute right-6 bottom-4 text-7xl opacity-20 group-hover:opacity-30 
                               transition-opacity duration-300 select-none">
                {slide.emoji}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Category Tiles ────────────────────────────────────────────────── */}
      <section className="container-page py-8">
        <h2 className="section-title mb-5">Shop by Category</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${cat.name}`}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl ${cat.color} 
                          hover:scale-105 transition-transform duration-200 cursor-pointer`}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs font-semibold text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Featured Products ─────────────────────────────────────────────── */}
      <section className="container-page py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Featured Products</h2>
          <Link
            to="/products?isFeatured=true"
            className="text-sm font-semibold text-brand-500 hover:text-brand-600 
                        flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loadingFeatured
            ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
            : featuredData?.products?.map((p) => <ProductCard key={p._id} product={p} />)
          }
        </div>
      </section>

      {/* ─── Promo Banner ──────────────────────────────────────────────────── */}
      <section className="container-page py-4">
        <div className="rounded-2xl bg-gradient-to-r from-dark to-gray-800 p-8 sm:p-12 text-white 
                         flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-brand-400 font-semibold text-sm mb-1">EXCLUSIVE OFFER</p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold mb-2">
              Get 20% Off Your First Order
            </h2>
            <p className="text-gray-400 text-sm">Use code <span className="text-white font-mono font-bold">WELCOME20</span> at checkout</p>
          </div>
          <Link
            to="/register"
            className="btn-primary flex-shrink-0 bg-brand-500 hover:bg-brand-600 text-white"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* ─── New Arrivals ──────────────────────────────────────────────────── */}
      <section className="container-page py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">New Arrivals</h2>
          <Link
            to="/products?sort=newest"
            className="text-sm font-semibold text-brand-500 hover:text-brand-600 
                        flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loadingNew
            ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
            : newArrivalsData?.products?.map((p) => <ProductCard key={p._id} product={p} />)
          }
        </div>
      </section>

      {/* ─── Brand Promises ────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 mt-8">
        <div className="container-page py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {PROMISES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-brand-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-dark">{title}</p>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
