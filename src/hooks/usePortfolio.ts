import { useQuery } from '@tanstack/react-query'
import { portfolioApi, analyticsApi } from '@/lib/apiClient'
import type { Benchmark } from '@/types'

export function useSymbolQuote(symbol: string) {
  return useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => portfolioApi.getQuote(symbol),
    enabled: symbol.length >= 1,
    staleTime: 60_000,
    retry: false,
  })
}

const MARKET_TICKERS = [
  { symbol: '^GSPC', label: 'S&P 500' },
  { symbol: '^IXIC', label: 'NASDAQ' },
  { symbol: '^VIX', label: 'VIX' },
  { symbol: 'GC=F', label: 'Gold' },
] as const

export function useMarketTickers() {
  return useQuery({
    queryKey: ['market', 'tickers'],
    queryFn: async () => {
      const results = await Promise.all(
        MARKET_TICKERS.map(({ symbol, label }) =>
          portfolioApi.getQuote(symbol).then((q) => ({
            symbol,
            label,
            price: q.price,
            day_change_pct: q.day_change_pct,
          })).catch(() => ({ symbol, label, price: 0, day_change_pct: 0 }))
        )
      )
      return results
    },
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  })
}

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
