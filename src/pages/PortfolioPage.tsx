import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { usePortfolioSummary } from '@/hooks/usePortfolio'
import type { Position } from '@/types'

function fmt(n: number | undefined | null, decimals = 2) {
  if (n == null || isNaN(n)) return '—'
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function fmtUsd(n: number | undefined | null) {
  return '$' + fmt(n)
}

function PnlCell({ value }: { value: number | undefined | null }) {
  const v = value ?? 0
  const color = v >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'
  return <span className={color}>{v >= 0 ? '+' : ''}{fmtUsd(v)}</span>
}

function PctCell({ value }: { value: number | undefined | null }) {
  const v = value ?? 0
  const color = v >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'
  return <span className={color}>{v >= 0 ? '+' : ''}{fmt(v)}%</span>
}

const columns: ColumnDef<Position>[] = [
  {
    id: 'symbol',
    header: 'Symbol',
    accessorFn: (r) => r.symbol,
    cell: ({ row }) => {
      const pos = row.original
      return (
        <div>
          <div className="font-medium text-[#e8e6f0]">{pos.symbol}</div>
          <div className="text-xs text-[#5e5c6e] truncate max-w-40">{pos.company_name}</div>
        </div>
      )
    },
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
    cell: ({ getValue }) => <span className="text-[#9997aa]">{fmt(getValue() as number, 5)}</span>,
  },
  {
    accessorKey: 'avg_cost',
    header: 'Avg Cost',
    cell: ({ getValue }) => fmtUsd(getValue() as number),
  },
  {
    accessorKey: 'current_price',
    header: 'Price',
    cell: ({ getValue }) => fmtUsd(getValue() as number),
  },
  {
    accessorKey: 'day_change_pct',
    header: 'Day %',
    cell: ({ getValue }) => <PctCell value={getValue() as number} />,
  },
  {
    accessorKey: 'market_value',
    header: 'Market Value',
    cell: ({ getValue }) => fmtUsd(getValue() as number),
  },
  {
    accessorKey: 'unrealized_pnl',
    header: 'Unrealized P&L',
    cell: ({ getValue }) => <PnlCell value={getValue() as number} />,
  },
  {
    accessorKey: 'unrealized_pnl_pct',
    header: 'P&L %',
    cell: ({ getValue }) => <PctCell value={getValue() as number} />,
  },
  {
    accessorKey: 'weight_pct',
    header: 'Weight',
    cell: ({ getValue }) => <span className="text-[#9997aa]">{fmt(getValue() as number)}%</span>,
  },
]

export function PortfolioPage() {
  const { data, isLoading, isError } = usePortfolioSummary()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'weight_pct', desc: true }])

  const table = useReactTable({
    data: data?.positions ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-6">
      {/* Hero metrics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl p-5">
          <div className="text-xs text-[#5e5c6e] uppercase tracking-wider mb-2">Total Value</div>
          <div className="text-2xl font-semibold text-[#e8e6f0]">
            {isLoading ? '—' : fmtUsd(data?.total_value ?? 0)}
          </div>
        </div>
        <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl p-5">
          <div className="text-xs text-[#5e5c6e] uppercase tracking-wider mb-2">Total Cost</div>
          <div className="text-2xl font-semibold text-[#e8e6f0]">
            {isLoading ? '—' : fmtUsd(data?.total_cost ?? 0)}
          </div>
        </div>
        <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl p-5">
          <div className="text-xs text-[#5e5c6e] uppercase tracking-wider mb-2">
            Unrealized P&amp;L
          </div>
          <div className="text-2xl font-semibold">
            {isLoading ? (
              '—'
            ) : (
              <>
                <PnlCell value={data?.total_unrealized_pnl ?? 0} />
                <span className="text-base ml-2">
                  (<PctCell value={data?.total_unrealized_pnl_pct ?? 0} />)
                </span>
              </>
            )}
          </div>
        </div>
        <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl p-5">
          <div className="text-xs text-[#5e5c6e] uppercase tracking-wider mb-2">
            Realized P&amp;L
          </div>
          <div className="text-2xl font-semibold">
            {isLoading ? '—' : <PnlCell value={data?.total_realized_pnl ?? 0} />}
          </div>
        </div>
        <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl p-5">
          <div className="text-xs text-[#5e5c6e] uppercase tracking-wider mb-2">Total P&amp;L</div>
          <div className="text-2xl font-semibold">
            {isLoading ? '—' : (
              <>
                <PnlCell value={data?.total_pnl ?? 0} />
                <span className="text-base ml-2">
                  (<PctCell value={data?.total_pnl_pct ?? 0} />)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Holdings table */}
      <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2e2e3a]">
          <h2 className="text-sm font-medium text-[#e8e6f0]">Holdings</h2>
        </div>
        {isError ? (
          <div className="p-6 text-sm text-[#f87171]">Failed to load portfolio data.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-[#2e2e3a]">
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className={`px-4 py-3 text-left text-xs text-[#5e5c6e] uppercase tracking-wider font-medium whitespace-nowrap ${h.column.getCanSort() ? 'cursor-pointer select-none hover:text-[#9997aa]' : ''}`}
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getCanSort() && (
                            <span className="text-[#3e3e4e]">
                              {h.column.getIsSorted() === 'asc'
                                ? '↑'
                                : h.column.getIsSorted() === 'desc'
                                  ? '↓'
                                  : '↕'}
                            </span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#2e2e3a]/50">
                      {columns.map((_, ci) => (
                        <td key={ci} className="px-4 py-3">
                          <div className="h-4 bg-[#22222e] rounded animate-pulse w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-12 text-center text-[#5e5c6e]"
                    >
                      No positions. Import a CSV or add a transaction.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#2e2e3a]/50 hover:bg-[#1e1e28] transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-[#e8e6f0] whitespace-nowrap"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
