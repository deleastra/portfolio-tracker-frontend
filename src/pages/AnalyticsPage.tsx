import { useState, useRef, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { HelpCircle, Settings } from 'lucide-react'
import { usePerformance, useMetrics, usePnL, usePortfolioSummary } from '@/hooks/usePortfolio'
import type { Benchmark, PnLEntry } from '@/types'

interface MetricInfoData {
  description: string
  formula: string
  good: string
  bad: string
}

const METRIC_INFO: Record<string, MetricInfoData> = {
  'Total Return': {
    description: 'ผลตอบแทนรวมของพอร์ตในช่วงเวลาที่เลือก คิดเป็นเปอร์เซ็นต์จากมูลค่าเริ่มต้น',
    formula: '(มูลค่าสิ้นสุด − มูลค่าเริ่มต้น) ÷ มูลค่าเริ่มต้น × 100',
    good: '> 0% (เป็นบวก) ยิ่งสูงยิ่งดี',
    bad: '< 0% แสดงว่าพอร์ตขาดทุน',
  },
  'Benchmark Return': {
    description: 'ผลตอบแทนของดัชนีอ้างอิง (Benchmark) ที่ใช้เปรียบเทียบกับพอร์ต',
    formula: '(ราคาสิ้นสุด − ราคาเริ่มต้น) ÷ ราคาเริ่มต้น × 100',
    good: 'ใช้เป็นเกณฑ์เปรียบเทียบ — พอร์ตควรทำผลได้ดีกว่า Benchmark',
    bad: 'หาก Total Return ต่ำกว่า Benchmark แสดงว่าบริหารพอร์ตได้ต่ำกว่า Index',
  },
  'Alpha': {
    description: 'ผลตอบแทนส่วนเกินที่พอร์ตทำได้เมื่อเทียบกับ Benchmark ปรับด้วย Beta แล้ว แสดงถึงความสามารถในการเลือกหุ้น',
    formula: 'Alpha = Total Return − [Rf + Beta × (Benchmark Return − Rf)]',
    good: '> 0% แสดงว่าพอร์ตสร้างผลตอบแทนเกินกว่าที่ Benchmark ให้',
    bad: '< 0% แสดงว่าพอร์ตทำผลได้ต่ำกว่าที่ควร',
  },
  'Beta': {
    description: 'วัดความผันผวนของพอร์ตเทียบกับ Benchmark Beta = 1 หมายถึงเคลื่อนไหวเท่ากัน',
    formula: 'Beta = Cov(Rp, Rm) ÷ Var(Rm)',
    good: '0.8 – 1.2 ถือว่าสมเหตุสมผล, < 1 ความเสี่ยงต่ำกว่า Benchmark',
    bad: '> 1.5 พอร์ตผันผวนสูงกว่า Benchmark มาก, < 0 เคลื่อนไหวสวนทาง',
  },
  'Sharpe Ratio': {
    description: 'วัดผลตอบแทนต่อหน่วยความเสี่ยงรวม (Std Dev) เป็น metric มาตรฐานที่นิยมมากที่สุด',
    formula: 'Sharpe = (Rp − Rf) ÷ σp',
    good: '≥ 1.0 ดี, ≥ 2.0 ดีมาก, ≥ 3.0 ยอดเยี่ยม',
    bad: '< 1.0 ผลตอบแทนต่อความเสี่ยงน้อย, < 0 แย่มาก',
  },
  'Sortino Ratio': {
    description: 'คล้าย Sharpe แต่วัดความเสี่ยงเฉพาะ Downside (ขาลง) เท่านั้น เหมาะกับนักลงทุนที่กังวลเรื่องขาดทุน',
    formula: 'Sortino = (Rp − Rf) ÷ σ_downside',
    good: '≥ 1.0 ดี, ≥ 2.0 ดีมาก — ยิ่งสูงยิ่งบริหารความเสี่ยงขาลงได้ดี',
    bad: '< 1.0 ความเสี่ยงขาลงสูงเกินไปเมื่อเทียบผลตอบแทน',
  },
  'Max Drawdown': {
    description: 'การลดลงสูงสุดจากจุดสูงสุดสู่จุดต่ำสุดของพอร์ต แสดงถึง worst-case ที่เคยเกิดขึ้น',
    formula: 'Max DD = (Trough − Peak) ÷ Peak × 100',
    good: '> −10% ถือว่าดีมาก, > −20% พอรับได้',
    bad: '< −30% ความเสี่ยงสูงมาก, < −50% อันตราย',
  },
  'Calmar Ratio': {
    description: 'วัดผลตอบแทนต่อหน่วย Max Drawdown แสดงว่าคุ้มค่ากับความเสี่ยงขาลงสูงสุดหรือไม่',
    formula: 'Calmar = Annualized Return ÷ |Max Drawdown|',
    good: '≥ 1.0 ดี, ≥ 3.0 ดีมาก',
    bad: '< 0.5 ผลตอบแทนไม่คุ้มกับ Drawdown ที่รับ',
  },
  'Information Ratio': {
    description: 'วัดผลตอบแทนส่วนเกิน (Active Return) ต่อ Tracking Error แสดงประสิทธิภาพในการ Active Management',
    formula: 'IR = (Rp − Rb) ÷ Tracking Error',
    good: '≥ 0.5 ดี, ≥ 1.0 ดีมาก — แสดงว่า Active Management คุ้มค่า',
    bad: '< 0 แสดงว่าการ Active Management ให้ผลเสีย',
  },
  'Treynor Ratio': {
    description: 'คล้าย Sharpe แต่ใช้ Beta แทน Std Dev เหมาะกับพอร์ตที่เป็นส่วนหนึ่งของพอร์ตใหญ่',
    formula: 'Treynor = (Rp − Rf) ÷ Beta',
    good: '> 0 ดี, ยิ่งสูงยิ่งแสดงว่าได้ผลตอบแทนต่อ Systematic Risk มาก',
    bad: '< 0 แสดงว่าผลตอบแทนต่ำกว่า Risk-free Rate',
  },
  'Tracking Error': {
    description: 'ส่วนเบี่ยงเบนมาตรฐานของ Active Return ที่พอร์ตเบี่ยงจาก Benchmark',
    formula: 'TE = Std Dev(Rp − Rb)',
    good: '< 5% สำหรับ Passive, 5–15% สำหรับ Active ที่มีวินัย',
    bad: '> 20% พอร์ตเบี่ยงจาก Benchmark มากเกินไป',
  },
  'Win Rate': {
    description: 'สัดส่วนของธุรกรรมที่ทำกำไรต่อจำนวนธุรกรรมทั้งหมด',
    formula: 'Win Rate = จำนวน Trade กำไร ÷ จำนวน Trade ทั้งหมด × 100',
    good: '≥ 50% ดี, ≥ 60% ดีมาก (ขึ้นกับ Risk:Reward ด้วย)',
    bad: '< 40% ต้องชดเชยด้วย Profit Factor สูง',
  },
  'Profit Factor': {
    description: 'อัตราส่วนรายได้รวมจาก Trade กำไร ต่อ รายจ่ายรวมจาก Trade ขาดทุน',
    formula: 'PF = กำไรรวม ÷ ขาดทุนรวม',
    good: '≥ 1.5 ดี, ≥ 2.0 ดีมาก',
    bad: '< 1.0 ระบบนี้ขาดทุนในระยะยาว',
  },
}

function MetricPopover({ info, onClose }: { info: MetricInfoData; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full left-0 mt-2 w-72 bg-[#22222e] border border-[#3a3a4a] rounded-xl shadow-xl p-4 text-xs"
    >
      <p className="text-[#c4c2d4] mb-3 leading-relaxed">{info.description}</p>
      <div className="mb-2">
        <span className="text-[#5e5c6e] uppercase tracking-wider font-medium">สูตรคำนวณ</span>
        <p className="text-[#a99ffc] mt-1 font-mono leading-relaxed">{info.formula}</p>
      </div>
      <div className="border-t border-[#2e2e3a] pt-2 mt-2 space-y-1">
        <div className="flex gap-2">
          <span className="text-[#34d399] font-medium shrink-0">เหมาะสม:</span>
          <span className="text-[#9997aa]">{info.good}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[#f87171] font-medium shrink-0">ไม่เหมาะสม:</span>
          <span className="text-[#9997aa]">{info.bad}</span>
        </div>
      </div>
    </div>
  )
}

const BENCHMARKS: { value: Benchmark; label: string }[] = [
  { value: 'SPY', label: 'S&P 500 (SPY)' },
  { value: '^IXIC', label: 'Nasdaq Composite' },
  { value: '^NDX', label: 'Nasdaq-100' },
]

const RANGES = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: 'YTD', months: 0 },
  { label: '1Y', months: 12 },
] as const

function getDateRange(months: number): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  if (months === 0) {
    from.setMonth(0); from.setDate(1) // YTD
  } else {
    from.setMonth(from.getMonth() - months)
  }
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

function MetricCard({ label, value, suffix = '', green }: {
  label: string
  value: number | undefined
  suffix?: string
  green?: boolean
}) {
  const [open, setOpen] = useState(false)
  const info = METRIC_INFO[label]

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const color =
    green === undefined
      ? 'text-[#e8e6f0]'
      : green
      ? 'text-[#34d399]'
      : 'text-[#f87171]'

  return (
    <div className="relative bg-[#17171f] border border-[#2e2e3a] rounded-xl p-5">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs text-[#5e5c6e] uppercase tracking-wider">{label}</span>
        {info && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-[#3a3a4a] hover:text-[#7c6dfa] transition-colors ml-auto shrink-0"
            aria-label={`Info about ${label}`}
          >
            <HelpCircle size={13} />
          </button>
        )}
      </div>
      <div className={`text-xl font-semibold ${color}`}>
        {value === undefined ? '—' : fmt(value) + suffix}
      </div>
      {open && info && (
        <MetricPopover info={info} onClose={() => setOpen(false)} />
      )}
    </div>
  )
}

export function AnalyticsPage() {
  const [benchmark, setBenchmark] = useState<Benchmark>('SPY')
  const [rangeIdx, setRangeIdx] = useState(3) // default YTD
  const { from, to } = getDateRange(RANGES[rangeIdx].months)

  const perf = usePerformance({ from, to, benchmark })
  const metrics = useMetrics({ benchmark, from, to })

  const m = metrics.data

  const chartData =
    perf.data?.points?.map((p) => ({
      date: p.date.slice(5), // MM-DD
      Portfolio: parseFloat(p.portfolio_return_pct.toFixed(2)),
      Benchmark: parseFloat(p.benchmark_return_pct.toFixed(2)),
    })) ?? []

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                rangeIdx === i
                  ? 'bg-[#7c6dfa]/20 text-[#a99ffc]'
                  : 'text-[#9997aa] hover:bg-[#1e1e28]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <select
          value={benchmark}
          onChange={(e) => setBenchmark(e.target.value as Benchmark)}
          className="ml-auto bg-[#22222e] border border-[#2e2e3a] text-[#e8e6f0] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#7c6dfa]"
        >
          {BENCHMARKS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      {/* Performance Chart */}
      <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl p-6">
        <div className="text-sm font-medium text-[#e8e6f0] mb-4">
          Cumulative Return vs {BENCHMARKS.find((b) => b.value === benchmark)?.label}
        </div>
        {perf.isLoading ? (
          <div className="h-64 flex items-center justify-center text-[#5e5c6e] text-sm">
            Loading chart…
          </div>
        ) : perf.isError || chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-[#5e5c6e] text-sm">
            No performance data for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e3a" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#5e5c6e', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#2e2e3a' }}
              />
              <YAxis
                tick={{ fill: '#5e5c6e', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#22222e',
                  border: '1px solid #2e2e3a',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#e8e6f0',
                }}
                formatter={(v) => [`${v}%`]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#9997aa', paddingTop: 8 }}
              />
              <Line
                type="monotone"
                dataKey="Portfolio"
                stroke="#7c6dfa"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#7c6dfa' }}
              />
              <Line
                type="monotone"
                dataKey="Benchmark"
                stroke="#9997aa"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 3, fill: '#9997aa' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-4 lg:grid-cols-5">
        <MetricCard label="Total Return" value={m?.total_return_pct} suffix="%" green={(m?.total_return_pct ?? 0) >= 0} />
        <MetricCard label="Benchmark Return" value={m?.benchmark_return_pct} suffix="%" green={(m?.benchmark_return_pct ?? 0) >= 0} />
        <MetricCard label="Alpha" value={m?.alpha} suffix="%" green={(m?.alpha ?? 0) >= 0} />
        <MetricCard label="Beta" value={m?.beta} />
        <MetricCard label="Sharpe Ratio" value={m?.sharpe_ratio} green={(m?.sharpe_ratio ?? 0) >= 1} />
      </div>
      <div className="grid grid-cols-3 gap-4 lg:grid-cols-5">
        <MetricCard label="Sortino Ratio" value={m?.sortino_ratio} green={(m?.sortino_ratio ?? 0) >= 1} />
        <MetricCard label="Max Drawdown" value={m?.max_drawdown} suffix="%" green={(m?.max_drawdown ?? 0) >= 0} />
        <MetricCard label="Calmar Ratio" value={m?.calmar_ratio} green={(m?.calmar_ratio ?? 0) >= 0} />
        <MetricCard label="Information Ratio" value={m?.information_ratio} green={(m?.information_ratio ?? 0) >= 0} />
        <MetricCard label="Treynor Ratio" value={m?.treynor_ratio} green={(m?.treynor_ratio ?? 0) >= 0} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Tracking Error" value={m?.tracking_error} suffix="%" />
        <MetricCard label="Win Rate" value={m?.win_rate} suffix="%" green={(m?.win_rate ?? 0) >= 50} />
        <MetricCard label="Profit Factor" value={m?.profit_factor} green={(m?.profit_factor ?? 0) >= 1} />
      </div>

      {/* Benchmark comparison table */}
      <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2e2e3a] text-sm font-medium text-[#e8e6f0]">
          Period Comparison
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e3a]">
              <th className="px-4 py-3 text-left text-xs text-[#5e5c6e] uppercase tracking-wider">Period</th>
              <th className="px-4 py-3 text-right text-xs text-[#5e5c6e] uppercase tracking-wider">Portfolio</th>
              <th className="px-4 py-3 text-right text-xs text-[#5e5c6e] uppercase tracking-wider">
                {BENCHMARKS.find((b) => b.value === benchmark)?.label}
              </th>
              <th className="px-4 py-3 text-right text-xs text-[#5e5c6e] uppercase tracking-wider">Alpha</th>
            </tr>
          </thead>
          <tbody>
            {metrics.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#2e2e3a]/50">
                    {[1, 2, 3, 4].map((ci) => (
                      <td key={ci} className="px-4 py-3">
                        <div className="h-4 bg-[#22222e] rounded animate-pulse w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              : RANGES.map((r) => {
                  const { from: rf, to: rt } = getDateRange(r.months)
                  return (
                    <ComparisonRow
                      key={r.label}
                      label={r.label}
                      benchmark={benchmark}
                      from={rf}
                      to={rt}
                    />
                  )
                })}
          </tbody>
        </table>
      </div>

      {/* Holdings Performance */}
      <HoldingsPerformance />
    </div>
  )
}

function ComparisonRow({
  label,
  benchmark,
  from,
  to,
}: {
  label: string
  benchmark: Benchmark
  from: string
  to: string
}) {
  const { data } = useMetrics({ benchmark, from, to })

  function fmt(n: number | undefined) {
    if (n === undefined) return '—'
    const s = (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
    return s
  }

  function color(n: number | undefined) {
    if (n === undefined) return 'text-[#9997aa]'
    return n >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'
  }

  return (
    <tr className="border-b border-[#2e2e3a]/50 hover:bg-[#1e1e28] transition-colors">
      <td className="px-4 py-3 text-[#9997aa]">{label}</td>
      <td className={`px-4 py-3 text-right font-medium ${color(data?.total_return_pct)}`}>
        {fmt(data?.total_return_pct)}
      </td>
      <td className={`px-4 py-3 text-right ${color(data?.benchmark_return_pct)}`}>
        {fmt(data?.benchmark_return_pct)}
      </td>
      <td className={`px-4 py-3 text-right ${color(data?.alpha)}`}>
        {fmt(data?.alpha)}
      </td>
    </tr>
  )
}

type HoldingsTab = 'all' | 'gainers' | 'losers'
type ValueMode = 'percentage' | 'absolute'

function HoldingsPerformance() {
  const pnl = usePnL()
  const summary = usePortfolioSummary()
  const [tab, setTab] = useState<HoldingsTab>('all')
  const [showSold, setShowSold] = useState(true)
  const [valueMode, setValueMode] = useState<ValueMode>('percentage')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Build a map of open positions from portfolio summary (has correct current prices)
  const summaryPositionMap = useMemo(() => {
    const map = new Map<string, { unrealized_pnl: number; cost_basis: number }>()
    for (const pos of summary.data?.positions ?? []) {
      map.set(pos.symbol, { unrealized_pnl: pos.unrealized_pnl, cost_basis: pos.cost_basis })
    }
    return map
  }, [summary.data])

  // Merge PnL entries with correct unrealized P&L from portfolio summary
  const entries: PnLEntry[] = useMemo(() => {
    return (pnl.data?.entries ?? []).map((e) => {
      if (!e.is_open) return e
      const live = summaryPositionMap.get(e.symbol)
      if (!live) return e
      const totalPnl = e.realized_pnl + live.unrealized_pnl
      // cost_basis from PnL entry already includes realized cost basis; replace the open part
      const realizedCostBasis = e.cost_basis - (summaryPositionMap.get(e.symbol)?.cost_basis ?? 0)
      // Recalculate: total cost = realizedCostBasis + live open cost_basis
      const totalCostBasis = realizedCostBasis + live.cost_basis
      const totalPnlPct = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0
      return {
        ...e,
        unrealized_pnl: live.unrealized_pnl,
        total_pnl: totalPnl,
        total_pnl_pct: totalPnlPct,
        cost_basis: totalCostBasis,
      }
    })
  }, [pnl.data, summaryPositionMap])

  const filtered = entries
    .filter((e) => showSold || e.is_open)
    .filter((e) => {
      if (tab === 'gainers') return e.total_pnl > 0
      if (tab === 'losers') return e.total_pnl < 0
      return true
    })
    .sort((a, b) => {
      const va = valueMode === 'percentage' ? a.total_pnl_pct : a.total_pnl
      const vb = valueMode === 'percentage' ? b.total_pnl_pct : b.total_pnl
      return vb - va
    })

  const maxAbs = filtered.reduce((m, e) => {
    const v = Math.abs(valueMode === 'percentage' ? e.total_pnl_pct : e.total_pnl)
    return v > m ? v : m
  }, 0)

  function fmtValue(e: PnLEntry) {
    if (valueMode === 'percentage') {
      const v = e.total_pnl_pct
      return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'
    }
    const v = e.total_pnl
    const sign = v >= 0 ? '+' : ''
    return sign + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const tabs: { key: HoldingsTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'gainers', label: 'Gainers' },
    { key: 'losers', label: 'Losers' },
  ]

  return (
    <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#2e2e3a] flex items-center justify-between">
        <span className="text-sm font-medium text-[#e8e6f0]">Holdings performance</span>
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="p-1.5 rounded-lg text-[#5e5c6e] hover:text-[#a99ffc] hover:bg-[#22222e] transition-colors"
            aria-label="Settings"
          >
            <Settings size={15} />
          </button>
          {settingsOpen && (
            <div className="absolute z-50 top-full right-0 mt-2 w-52 bg-[#22222e] border border-[#3a3a4a] rounded-xl shadow-xl p-4 text-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#c4c2d4]">Display sold</span>
                <button
                  onClick={() => setShowSold((v) => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${showSold ? 'bg-[#7c6dfa]' : 'bg-[#3a3a4a]'}`}
                  aria-label="Toggle display sold"
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showSold ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
              <div>
                <div className="text-[#5e5c6e] uppercase tracking-wider mb-2">Value</div>
                {(['absolute', 'percentage'] as ValueMode[]).map((mode) => (
                  <label key={mode} className="flex items-center gap-2 cursor-pointer py-1">
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                        valueMode === mode ? 'border-[#7c6dfa] bg-[#7c6dfa]' : 'border-[#5e5c6e]'
                      }`}
                    >
                      {valueMode === mode && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-[#c4c2d4] capitalize" onClick={() => setValueMode(mode)}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-3 flex gap-4 border-b border-[#2e2e3a]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-[#7c6dfa] text-[#a99ffc]'
                : 'border-transparent text-[#5e5c6e] hover:text-[#9997aa]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Bars */}
      <div className="px-6 py-4">
        {pnl.isLoading || summary.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 h-6">
                <div className="w-12 h-4 bg-[#22222e] rounded animate-pulse shrink-0" />
                <div className="flex-1 h-4 bg-[#22222e] rounded animate-pulse" />
                <div className="w-16 h-4 bg-[#22222e] rounded animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-[#5e5c6e] text-sm">No data</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((entry) => {
              const value = valueMode === 'percentage' ? entry.total_pnl_pct : entry.total_pnl
              const pct = maxAbs > 0 ? (Math.abs(value) / maxAbs) * 100 : 0
              const isPositive = value >= 0
              return (
                <div key={entry.symbol} className="flex items-center gap-3 group">
                  {/* Ticker */}
                  <div className="w-12 text-right text-xs font-medium text-[#9997aa] shrink-0">
                    {entry.symbol}
                  </div>
                  {/* Bar track */}
                  <div className="flex-1 h-5 relative">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-sm transition-all ${
                        isPositive ? 'bg-[#34d399]/80' : 'bg-[#f87171]/80'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                    {!entry.is_open && (
                      <span className="absolute right-0 top-0 h-full flex items-center pr-1 text-[10px] text-[#5e5c6e]">
                        closed
                      </span>
                    )}
                  </div>
                  {/* Value */}
                  <div
                    className={`w-20 text-right text-xs font-medium shrink-0 ${
                      isPositive ? 'text-[#34d399]' : 'text-[#f87171]'
                    }`}
                  >
                    {fmtValue(entry)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* X-axis label */}
      {!pnl.isLoading && !summary.isLoading && filtered.length > 0 && (
        <div className="px-6 pb-4 flex justify-between text-[10px] text-[#5e5c6e]">
          <span>0{valueMode === 'percentage' ? '%' : ''}</span>
          <span>
            {valueMode === 'percentage'
              ? (maxAbs / 2).toFixed(0) + '%'
              : (maxAbs / 2).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
          <span>
            {valueMode === 'percentage'
              ? maxAbs.toFixed(0) + '%'
              : maxAbs.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}
    </div>
  )
}
