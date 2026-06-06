// Auth
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
}

// Portfolio
export interface Position {
  symbol: string
  company_name: string
  quantity: number
  avg_cost: number
  current_price: number
  day_change_pct: number
  market_value: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
  cost_basis: number
  weight_pct: number
  currency: string
  exchange: string
}

export interface PortfolioSummary {
  total_value: number
  total_cost: number
  total_unrealized_pnl: number
  total_unrealized_pnl_pct: number
  total_realized_pnl: number
  total_pnl: number
  total_pnl_pct: number
  positions: Position[]
}

// Transactions
export type TransactionAction = 'BUY' | 'SELL'

export interface Transaction {
  id: string
  portfolio_id: string
  symbol: string
  company_name: string
  trade_date: string
  settlement_date: string
  action: TransactionAction
  quantity: number
  traded_price: number
  gross_amount: number
  commission: number
  vat: number
  net_amount: number
  currency: string
  created_at: string
}

export interface TransactionListResponse {
  data: Transaction[]
  total: number
  page: number
  page_size: number
}

export interface CreateTransactionRequest {
  symbol: string
  company_name: string
  trade_date: string
  settlement_date: string
  action: TransactionAction
  quantity: number
  traded_price: number
  gross_amount: number
  commission: number
  vat: number
  net_amount: number
  currency: string
}

// P&L
export interface PnLEntry {
  symbol: string
  company_name: string
  realized_pnl: number
  unrealized_pnl: number
  total_pnl: number
  cost_basis: number
  total_pnl_pct: number
  is_open: boolean
}

export interface PnLSummary {
  realized_pnl: number
  unrealized_pnl: number
  total_pnl: number
  entries: PnLEntry[]
}

// Analytics
export type Benchmark = 'SPY' | '^GSPC' | '^IXIC' | '^NDX'

export interface PerformancePoint {
  date: string
  portfolio_return_pct: number  // cumulative % e.g. 5.12 = +5.12%
  benchmark_return_pct: number
}

export interface PerformanceData {
  points: PerformancePoint[]
  benchmark: string
}

export interface PerformanceMetrics {
  benchmark: string
  total_return_pct: number
  benchmark_return_pct: number
  alpha: number
  beta: number
  sharpe_ratio: number
  sortino_ratio: number
  max_drawdown: number
  calmar_ratio: number
  information_ratio: number
  treynor_ratio: number
  tracking_error: number
  win_rate: number
  profit_factor: number
  period_days: number
}
