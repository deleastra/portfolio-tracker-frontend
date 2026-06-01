import { useState, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { X, Upload, Plus } from 'lucide-react'
import { useTransactions, useImportCsv, useCreateTransaction, useDeleteTransaction } from '@/hooks/useTransactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { formatDate } from '@/lib/dateUtils'
import type { Transaction, CreateTransactionRequest, TransactionAction } from '@/types'

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'trade_date',
    header: 'Date',
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-xs">{formatDate(getValue() as string)}</span>
    ),
  },
  {
    accessorKey: 'action',
    header: 'Type',
    cell: ({ getValue }) => {
      const v = getValue() as string
      return (
        <Badge variant={v === 'BUY' ? 'success' : 'destructive'}>
          {v}
        </Badge>
      )
    },
  },
  {
    id: 'asset',
    header: 'Asset',
    accessorFn: (r) => r.symbol,
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.symbol}</div>
        <div className="text-xs text-muted-foreground truncate max-w-48">{row.original.company_name}</div>
      </div>
    ),
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
    cell: ({ getValue }) => fmt(getValue() as number, 5),
  },
  {
    accessorKey: 'traded_price',
    header: 'Price',
    cell: ({ getValue }) => '$' + fmt(getValue() as number),
  },
  {
    accessorKey: 'net_amount',
    header: 'Net Amount',
    cell: ({ getValue }) => '$' + fmt(getValue() as number),
  },
  {
    accessorKey: 'commission',
    header: 'Commission',
    cell: ({ getValue }) => '$' + fmt(getValue() as number),
  },
  {
    id: 'actions',
    header: 'Delete',
    enableSorting: false,
    accessorFn: (r) => r.id,
    cell: ({ getValue }) => <DeleteButton id={getValue() as string} />,
  },
]

function DeleteButton({ id }: { id: string }) {
  const del = useDeleteTransaction()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => del.mutate(id)}
      disabled={del.isPending}
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  )
}

const EMPTY_FORM: CreateTransactionRequest = {
  symbol: '',
  company_name: '',
  trade_date: '',
  settlement_date: '',
  action: 'BUY',
  quantity: 0,
  traded_price: 0,
  gross_amount: 0,
  commission: 0,
  vat: 0,
  net_amount: 0,
  currency: 'USD',
}

export function TransactionsPage() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [symbolFilter, setSymbolFilter] = useState('')
  const [symbolInput, setSymbolInput] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'trade_date', desc: true }])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateTransactionRequest>(EMPTY_FORM)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useTransactions({
    page,
    page_size: 20,
    action: actionFilter || undefined,
    symbol: symbolFilter || undefined,
  })
  const importCsv = useImportCsv()
  const createTx = useCreateTransaction()

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const totalPages = data ? Math.ceil(data.total / 20) : 1
  const buys = data?.data.filter((t) => t.action === 'BUY').length ?? 0
  const sells = data?.data.filter((t) => t.action === 'SELL').length ?? 0

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) importCsv.mutate(file)
    e.target.value = ''
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTx.mutate(form, {
      onSuccess: () => {
        setShowForm(false)
        setForm(EMPTY_FORM)
      },
    })
  }

  const setField = <K extends keyof CreateTransactionRequest>(k: K, v: CreateTransactionRequest[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6">
      {/* Stats — daisyUI stats */}
      <div className="stats stats-horizontal shadow w-full border border-border bg-card">
        <div className="stat">
          <div className="stat-title text-xs uppercase tracking-wider">Total Transactions</div>
          <div className="stat-value text-xl font-semibold text-foreground">{data?.total ?? '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-title text-xs uppercase tracking-wider">Buys</div>
          <div className="stat-value text-xl font-semibold text-success">{buys}</div>
        </div>
        <div className="stat">
          <div className="stat-title text-xs uppercase tracking-wider">Sells</div>
          <div className="stat-value text-xl font-semibold text-destructive">{sells}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Filter group — daisyUI join */}
        <div className="join">
          {(['', 'BUY', 'SELL'] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setActionFilter(v); setPage(1) }}
              className={`join-item btn btn-sm ${actionFilter === v ? 'btn-primary' : 'btn-ghost'}`}
            >
              {v || 'All'}
            </button>
          ))}
        </div>

        {/* Symbol search */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSymbolFilter(symbolInput.trim().toUpperCase())
            setPage(1)
          }}
          className="flex gap-1"
        >
          <Input
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            placeholder="Filter asset"
            className="w-36 h-8 text-xs"
          />
          {symbolFilter && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => { setSymbolFilter(''); setSymbolInput(''); setPage(1) }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </form>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={importCsv.isPending}
          >
            <Upload className="h-3.5 w-3.5" />
            {importCsv.isPending ? 'Importing...' : 'Import CSV'}
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Transaction
          </Button>
        </div>
      </div>

      {/* Import feedback */}
      {importCsv.isSuccess && (
        <div className="alert alert-success text-sm">CSV imported successfully.</div>
      )}
      {importCsv.isError && (
        <div className="alert alert-error text-sm">Import failed. Check the CSV format.</div>
      )}

      {/* Add Transaction Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) { setShowForm(false); setForm(EMPTY_FORM) }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} id="tx-form">
            <div className="grid grid-cols-3 gap-4 py-4">
              {(
                [
                  { key: 'symbol', label: 'Symbol', type: 'text', placeholder: 'NVDA' },
                  { key: 'company_name', label: 'Company Name', type: 'text', placeholder: 'NVIDIA Corporation' },
                  { key: 'trade_date', label: 'Trade Date', type: 'date' },
                  { key: 'settlement_date', label: 'Settlement Date', type: 'date' },
                  { key: 'quantity', label: 'Quantity', type: 'number', step: 'any' },
                  { key: 'traded_price', label: 'Price', type: 'number', step: 'any' },
                  { key: 'gross_amount', label: 'Gross Amount', type: 'number', step: 'any' },
                  { key: 'commission', label: 'Commission', type: 'number', step: 'any' },
                  { key: 'net_amount', label: 'Net Amount', type: 'number', step: 'any' },
                ] as const
              ).map(({ key, label, type, ...rest }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  <Input
                    type={type}
                    value={form[key] as string | number}
                    onChange={(e) =>
                      setField(
                        key,
                        type === 'number' ? parseFloat(e.target.value) || 0 : (e.target.value as never),
                      )
                    }
                    required
                    {...rest}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Action</label>
                <Select
                  value={form.action}
                  onValueChange={(v) => setField('action', v as TransactionAction)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">BUY</SelectItem>
                    <SelectItem value="SELL">SELL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>
              Cancel
            </Button>
            <Button type="submit" form="tx-form" disabled={createTx.isPending}>
              {createTx.isPending ? 'Saving...' : 'Save Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className={`text-xs uppercase tracking-wider whitespace-nowrap ${
                      h.column.getCanSort() ? 'cursor-pointer select-none hover:text-foreground' : ''
                    }`}
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && (
                        <span className="text-muted-foreground/50">
                          {h.column.getIsSorted() === 'asc' ? '▲' : h.column.getIsSorted() === 'desc' ? '▼' : '•'}
                        </span>
                      )}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, ci) => (
                      <TableCell key={ci}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {/* Pagination ” daisyUI join */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Page {page} of {totalPages} total {data?.total} transactions
            </span>
            <div className="join">
              <button
                className="join-item btn btn-xs"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <button
                className="join-item btn btn-xs"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

