/**
 * useRecommendations.js
 * ─────────────────────
 * React Query hooks for all recommendation API calls.
 * Add to: frontend/src/hooks/useRecommendations.js
 */

import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

// ── Personalized recommendations (logged-in user) ────────────────────────────
export function useRecommendations(limit = 10) {
  return useQuery({
    queryKey: ['recommendations', 'personal', limit],
    queryFn: () => api.get(`/recommendations?limit=${limit}`),
    staleTime: 5 * 60 * 1000,   // 5 min — don't refetch too often
    retry: 1,
    enabled: true,
  });
}

// ── Popular products (works for guests too) ───────────────────────────────────
export function usePopularProducts(limit = 10) {
  return useQuery({
    queryKey: ['recommendations', 'popular', limit],
    queryFn: () => api.get(`/recommendations/popular?limit=${limit}`),
    staleTime: 10 * 60 * 1000,  // 10 min
    retry: 1,
  });
}

// ── Similar products (product detail page) ────────────────────────────────────
export function useSimilarProducts(productId, limit = 8) {
  return useQuery({
    queryKey: ['recommendations', 'similar', productId, limit],
    queryFn: () => api.get(`/recommendations/similar/${productId}?limit=${limit}`),
    staleTime: 10 * 60 * 1000,
    retry: 1,
    enabled: !!productId,
  });
}

// ── Admin: model status ───────────────────────────────────────────────────────
export function useMLStatus() {
  return useQuery({
    queryKey: ['ml', 'status'],
    queryFn: () => api.get('/recommendations/status'),
    staleTime: 60 * 1000,        // 1 min
    retry: false,
  });
}

// ── Admin: sales analytics ────────────────────────────────────────────────────
export function useSalesAnalytics() {
  return useQuery({
    queryKey: ['ml', 'analytics'],
    queryFn: () => api.get('/recommendations/analytics'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
