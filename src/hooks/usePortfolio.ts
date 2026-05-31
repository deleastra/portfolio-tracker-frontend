import { useQuery } from '@tanstack/react-query'
import { portfolioApi, analyticsApi } from '@/lib/apiClient'
import type { Benchmark } from '@/types'

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: portfolioApi.getSummary,
    refetchInterval: 60_000, // refresh every 60s
    staleTime: 30_000,
  })
}

export function usePnL() {
  return useQuery({
    queryKey: ['analytics', 'pnl'],
    queryFn: portfolioApi.getPnL,
    staleTime: 30_000,
  })
}

export function usePerformance(params: { from: string; to: string; benchmark: Benchmark }) {
  return useQuery({
    queryKey: ['analytics', 'performance', params],
    queryFn: () => analyticsApi.getPerformance(params),
    staleTime: 5 * 60_000,
    enabled: !!params.from && !!params.to,
  })
}

export function useMetrics(params: { benchmark: Benchmark; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['analytics', 'metrics', params],
    queryFn: () => analyticsApi.getMetrics(params),
    staleTime: 5 * 60_000,
  })
}
