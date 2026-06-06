import { useState, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react'
import { usePortfolioSummary } from '@/hooks/usePortfolio'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { portfolioApi } from '@/lib/apiClient'
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
  const cls = v >= 0 ? 'text-success' : 'text-destructive'
  return <span className={cls}>{v >= 0 ? '+' : ''}{fmtUsd(v)}</span>
}

function PctCell({ value }: { value: number | undefined | null }) {
  const v = value ?? 0
  const cls = v >= 0 ? 'text-success' : 'text-destructive'
  return <span className={cls}>{v >= 0 ? '+' : ''}{fmt(v)}%</span>
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
          <div className="font-medium">{pos.symbol}</div>
          <div className="text-xs text-muted-foreground truncate max-w-40">{pos.company_name}</div>
        </div>
      )
    },
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
    cell: ({ getValue }) => <span className="text-muted-foreground">{fmt(getValue() as number, 5)}</span>,
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
    cell: ({ getValue }) => <span className="text-muted-foreground">{fmt(getValue() as number)}%</span>,
  },
]

export function PortfolioPage() {
  const { data, isLoading, isError } = usePortfolioSummary()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'weight_pct', desc: true }])

  const handleExport = useCallback(async () => {
    const blob = await portfolioApi.exportCsv()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `portfolio_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const table = useReactTable({
    data: data?.positions ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const metrics = [
    { label: 'Total Value', value: isLoading ? null : fmtUsd(data?.total_value ?? 0) },
    { label: 'Total Cost', value: isLoading ? null : fmtUsd(data?.total_cost ?? 0) },
    {
      label: 'Unrealized P&L',
      value: isLoading ? null : (
        <>
          <PnlCell value={data?.total_unrealized_pnl ?? 0} />
          <span className="text-base ml-2">(<PctCell value={data?.total_unrealized_pnl_pct ?? 0} />)</span>
        </>
      ),
    },
    {
      label: 'Realized P&L',
      value: isLoading ? null : <PnlCell value={data?.total_realized_pnl ?? 0} />,
    },
    {
      label: 'Total P&L',
      value: isLoading ? null : (
        <>
          <PnlCell value={data?.total_pnl ?? 0} />
          <span className="text-base ml-2">(<PctCell value={data?.total_pnl_pct ?? 0} />)</span>
        </>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero metrics — responsive Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map(({ label, value }) => (
          <Card key={label} className="bg-card">
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
              <div className="text-lg font-semibold text-foreground leading-tight">
                {value ?? <Skeleton className="h-6 w-24" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Holdings table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Holdings</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!data?.positions?.length}
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isError ? (
            <div className="p-6 text-sm text-destructive">Failed to load portfolio data.</div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                    {hg.headers.map((h) => (
                      <TableHead
                        key={h.id}
                        className={`text-[11px] uppercase tracking-wider whitespace-nowrap ${h.column.getCanSort() ? 'cursor-pointer select-none hover:text-foreground' : ''}`}
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getCanSort() && (
                            <span className="text-muted-foreground/40">
                              {h.column.getIsSorted() === 'asc'
                                ? <ChevronUp className="h-3 w-3" />
                                : h.column.getIsSorted() === 'desc'
                                  ? <ChevronDown className="h-3 w-3" />
                                  : <ChevronsUpDown className="h-3 w-3" />}
                            </span>
                          )}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, ci) => (
                        <TableCell key={ci}>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                      No positions. Import a CSV or add a transaction.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/20 transition-colors border-b border-border/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
