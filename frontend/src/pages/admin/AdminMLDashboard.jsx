/**
 * AdminMLDashboard.jsx
 * ─────────────────────
 * Admin page showing:
 *  - ML model status + retrain button
 *  - 30-day revenue chart
 *  - Top products by revenue
 *  - Revenue by category (pie-style list)
 *
 * Add route in AdminLayout:
 *   <Route path="ml" element={<AdminMLDashboard />} />
 * Add nav item:
 *   { to: '/admin/ml', icon: Brain, label: 'ML & Analytics' }
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Brain, RefreshCw, TrendingUp, ShoppingBag, Users } from 'lucide-react';
import { useMLStatus, useSalesAnalytics } from '../../hooks/useRecommendations';
import { Spinner } from '../../components/common';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="text-2xl font-extrabold text-dark mt-1">{value}</p>
          {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

// ── Custom tooltip for charts ─────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name}>
          {p.name}: {p.name === 'revenue' ? `₹${p.value.toLocaleString('en-IN')}` : p.value}
        </p>
      ))}
    </div>
  );
}

export default function AdminMLDashboard() {
  const queryClient = useQueryClient();
  const { data: statusData } = useMLStatus();
  const { data: analyticsData, isLoading: loadingAnalytics } = useSalesAnalytics();

  const status = statusData || {};
  const sales  = analyticsData?.sales || {};
  const users  = analyticsData?.users || {};

  // Retrain mutation
  const retrain = useMutation({
    mutationFn: () => api.post('/recommendations/train'),
    onSuccess: () => {
      toast.success('Model retraining started! Takes ~2 minutes.');
      queryClient.invalidateQueries(['ml', 'status']);
    },
    onError: (err) => toast.error(err.message || 'Retraining failed'),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-xl font-bold flex items-center gap-2">
          <Brain size={22} className="text-brand-500" /> ML & Analytics
        </h1>
      </div>

      {/* ML model status card */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Brain size={16} className="text-purple-500" /> Recommendation Model
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className={`text-lg font-bold ${status.isTrained ? 'text-green-600' : 'text-amber-500'}`}>
              {status.isTrained ? 'Active' : 'Untrained'}
            </p>
            <p className="text-xs text-muted mt-0.5">Status</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-lg font-bold text-dark">{status.totalUsers ?? '—'}</p>
            <p className="text-xs text-muted mt-0.5">Trained users</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-lg font-bold text-dark">{status.totalInteractions ?? '—'}</p>
            <p className="text-xs text-muted mt-0.5">Interactions</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-medium text-dark">
              {status.trainedAt
                ? new Date(status.trainedAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })
                : 'Never'}
            </p>
            <p className="text-xs text-muted mt-0.5">Last trained</p>
          </div>
        </div>
        <button
          onClick={() => retrain.mutate()}
          disabled={retrain.isPending}
          className="btn-primary text-sm"
        >
          {retrain.isPending ? (
            <><Spinner size={14} /> Retraining...</>
          ) : (
            <><RefreshCw size={14} /> Retrain Model Now</>
          )}
        </button>
        <p className="text-xs text-muted mt-2">
          Model auto-retrains every night at 2:00 AM. Manual retrain takes ~2 minutes.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp} label="30-day Revenue"
          value={`₹${((sales.dailyRevenue?.reduce((s, d) => s + d.revenue, 0) || 0) / 1000).toFixed(1)}K`}
          color="bg-green-500"
        />
        <StatCard
          icon={ShoppingBag} label="Total Orders"
          value={users.totalOrders ?? '—'}
          color="bg-brand-500"
        />
        <StatCard
          icon={Users} label="Total Users"
          value={users.totalUsers ?? '—'}
          color="bg-purple-500"
        />
        <StatCard
          icon={Brain} label="Popular Products"
          value={status.popularProducts ?? '—'}
          sub="in fallback pool"
          color="bg-amber-500"
        />
      </div>

      {/* Revenue chart */}
      <div className="card p-6">
        <h2 className="font-semibold mb-5 flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-500" /> Daily Revenue — Last 30 Days
        </h2>
        {loadingAnalytics ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={sales.dailyRevenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="revenue" name="revenue"
                stroke="#e63328" strokeWidth={2} dot={false} activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top products + categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Top Products by Revenue</h2>
          {loadingAnalytics ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="space-y-3">
              {(sales.topProducts || []).slice(0, 6).map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                    <p className="text-xs text-muted">{p.units} units sold</p>
                  </div>
                  <span className="text-sm font-bold text-dark">
                    ₹{(p.revenue / 1000).toFixed(1)}K
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by category */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Revenue by Category</h2>
          {loadingAnalytics ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(sales.byCategory || []).slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="_id" tick={{ fontSize: 11 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="revenue" fill="#e63328" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
