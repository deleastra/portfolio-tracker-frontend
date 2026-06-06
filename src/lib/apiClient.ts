import { api } from '@/lib/api'
import type {
  LoginRequest,
  RegisterRequest,
  PortfolioSummary,
  TransactionListResponse,
  CreateTransactionRequest,
  PnLSummary,
  PerformanceData,
  PerformanceMetrics,
  Benchmark,
} from '@/types'

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (body: LoginRequest) =>
    api.post<{ access_token: string }>('/auth/login', body).then((r) => r.data),
  register: (body: RegisterRequest) =>
    api.post<{ access_token: string; id: string; email: string }>('/auth/register', body).then((r) => r.data),
  refresh: () =>
    api.post<{ access_token: string }>('/auth/refresh').then((r) => r.data),
  logout: () =>
    api.post('/auth/logout').then((r) => r.data),
}

// ── Portfolio ─────────────────────────────────────────────────────────────────
export const portfolioApi = {
  getSummary: () =>
    api.get<PortfolioSummary>('/portfolio/summary').then((r) => r.data),
  getPnL: () =>
    api.get<PnLSummary>('/analytics/pnl').then((r) => r.data),
  getQuote: (symbol: string) =>
    api.get<{ symbol: string; company_name: string; price: number; day_change_pct: number; currency: string }>(`/portfolio/quote/${encodeURIComponent(symbol)}`).then((r) => r.data),
}

// ── Transactions ─────────────────────────────────────────────────────────────
export const transactionApi = {
  list: (params?: { page?: number; page_size?: number; action?: string; symbol?: string }) =>
    api
      .get<TransactionListResponse>('/transactions', { params })
      .then((r) => r.data),
  create: (body: CreateTransactionRequest) =>
    api.post('/transactions', body).then((r) => r.data),
  update: (id: string, body: CreateTransactionRequest) =>
    api.put(`/transactions/${id}`, body).then((r) => r.data),
  delete: (id: string) => api.delete(`/transactions/${id}`).then((r) => r.data),
  importCsv: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post('/transactions/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getPerformance: (params: { from: string; to: string; benchmark: Benchmark }) =>
    api
      .get<PerformanceData>('/analytics/performance', { params })
      .then((r) => r.data),
  getMetrics: (params: { benchmark: Benchmark; from?: string; to?: string }) =>
    api
      .get<PerformanceMetrics>('/analytics/metrics', { params })
      .then((r) => r.data),
}
