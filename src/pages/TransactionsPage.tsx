import { useState, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { X, Upload, Plus, ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Pencil } from 'lucide-react'
import { useTransactions, useImportCsv, useCreateTransaction, useDeleteTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import { portfolioApi } from '@/lib/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
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
import { DatePicker } from '@/components/ui/date-picker'
import type { Transaction, CreateTransactionRequest, TransactionAction } from '@/types'

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}

function makeColumns(onEdit: (tx: Transaction) => void): ColumnDef<Transaction>[] {
  return [
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
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(row.original)}
            aria-label="Edit transaction"
            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <DeleteButton id={row.original.id} />
        </div>
      ),
    },
  ]
}

function DeleteButton({ id }: { id: string }) {
  const del = useDeleteTransaction()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => del.mutate(id)}
      disabled={del.isPending}
      aria-label="Delete transaction"
      className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  )
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_FORM: CreateTransactionRequest = {
  symbol: '',
  company_name: '',
  trade_date: todayIso(),
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
  const [rawInputs, setRawInputs] = useState<Partial<Record<'quantity' | 'traded_price' | 'commission' | 'vat' | 'gross_amount', string>>>({})
  const [quoteFetching, setQuoteFetching] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setRawInputs({})
    setQuoteFetching(false)
    setEditingTx(null)
  }

  const openEditDialog = (tx: Transaction) => {
    setForm({
      symbol: tx.symbol,
      company_name: tx.company_name,
      trade_date: tx.trade_date.slice(0, 10),
      settlement_date: '',
      action: tx.action,
      quantity: tx.quantity,
      traded_price: tx.traded_price,
      gross_amount: tx.gross_amount,
      commission: tx.commission,
      vat: tx.vat,
      net_amount: tx.net_amount,
      currency: tx.currency,
    })
    setRawInputs({})
    setQuoteFetching(false)
    setEditingTx(tx)
  }

  const handleSymbolBlur = async (symbol: string) => {
    if (!symbol) return
    setQuoteFetching(true)
    try {
      const q = await portfolioApi.getQuote(symbol)
      setForm((prev) => ({
        ...prev,
        company_name: prev.company_name || q.company_name,
        currency: q.currency || prev.currency,
      }))
    } catch {
      // symbol not found — leave fields as-is
    } finally {
      setQuoteFetching(false)
    }
  }

  const { data, isLoading } = useTransactions({
    page,
    page_size: 20,
    action: actionFilter || undefined,
    symbol: symbolFilter || undefined,
  })
  const importCsv = useImportCsv()
  const createTx = useCreateTransaction()
  const updateTx = useUpdateTransaction()

  const columns = makeColumns(openEditDialog)

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
    if (editingTx) {
      updateTx.mutate({ id: editingTx.id, body: form }, {
        onSuccess: () => { resetForm() },
      })
    } else {
      createTx.mutate(form, {
        onSuccess: () => {
          setShowForm(false)
          resetForm()
        },
      })
    }
  }

  const setField = <K extends keyof CreateTransactionRequest>(k: K, v: CreateTransactionRequest[K]) =>
    setForm((prev) => {
      const next = { ...prev, [k]: v }
      const qty = parseFloat(String(next.quantity)) || 0
      const price = parseFloat(String(next.traded_price)) || 0
      const comm = parseFloat(String(next.commission)) || 0
      const vat = parseFloat(String(next.vat)) || 0
      // Auto-calc gross = qty × price
      if (k === 'quantity' || k === 'traded_price') {
        next.gross_amount = parseFloat((qty * price).toFixed(6))
      }
      // Auto-calc net = gross + commission + vat
      if (k === 'quantity' || k === 'traded_price' || k === 'commission' || k === 'vat') {
        const g = (k === 'quantity' || k === 'traded_price') ? next.gross_amount : prev.gross_amount
        next.net_amount = parseFloat((g + comm + vat).toFixed(6))
      }
      return next
    })

  return (
    <div className="space-y-6">
      {/* Stats — responsive Card grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Total Transactions</div>
            <div className="text-lg font-semibold text-foreground">{data?.total ?? <Skeleton className="h-6 w-12" />}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Buys</div>
            <div className="text-lg font-semibold text-success">{isLoading ? <Skeleton className="h-6 w-12" /> : buys}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Sells</div>
            <div className="text-lg font-semibold text-destructive">{isLoading ? <Skeleton className="h-6 w-12" /> : sells}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter pills */}
        <div className="flex gap-1">
          {(['', 'BUY', 'SELL'] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setActionFilter(v); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                actionFilter === v
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
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
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">CSV imported successfully.</div>
      )}
      {importCsv.isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">Import failed. Check the CSV format.</div>
      )}

      <Dialog
        open={showForm || !!editingTx}
        onOpenChange={(open) => {
          if (!open) { setShowForm(false); resetForm() }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTx ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} id="tx-form">
            <div className="space-y-5 py-2">

              {/* Asset */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Asset</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Symbol <span className="text-destructive">*</span></label>
                    <Input
                      value={form.symbol}
                      onChange={(e) => setField('symbol', e.target.value.toUpperCase())}
                      onBlur={(e) => handleSymbolBlur(e.target.value)}
                      placeholder="NVDA"
                      required
                      className="font-mono tracking-wide"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Action <span className="text-destructive">*</span></label>
                    <Select value={form.action} onValueChange={(v) => setField('action', v as TransactionAction)}>
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
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Company Name
                    {quoteFetching && <Loader2 className="inline ml-1.5 h-3 w-3 animate-spin text-muted-foreground" />}
                  </label>
                  <Input
                    value={form.company_name}
                    onChange={(e) => setField('company_name', e.target.value as never)}
                    placeholder={quoteFetching ? 'Fetching...' : 'NVIDIA Corporation'}
                    disabled={quoteFetching}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dates</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Trade Date <span className="text-destructive">*</span></label>
                  <DatePicker
                    value={form.trade_date}
                    onChange={(v) => setField('trade_date', v as never)}
                  />
                </div>
              </div>

              {/* Amounts */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amounts</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Quantity <span className="text-destructive">*</span></label>
                    <Input
                      inputMode="decimal"
                      value={rawInputs.quantity ?? (form.quantity || '')}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (!/^\d*\.?\d*$/.test(raw)) return
                        setRawInputs(r => ({ ...r, quantity: raw }))
                        setField('quantity', parseFloat(raw) || 0)
                      }}
                      onBlur={(e) => {
                        setRawInputs(r => ({ ...r, quantity: undefined }))
                        setField('quantity', parseFloat(e.target.value) || 0)
                      }}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Price <span className="text-destructive">*</span></label>
                    <Input
                      inputMode="decimal"
                      value={rawInputs.traded_price ?? (form.traded_price || '')}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (!/^\d*\.?\d*$/.test(raw)) return
                        setRawInputs(r => ({ ...r, traded_price: raw }))
                        setField('traded_price', parseFloat(raw) || 0)
                      }}
                      onBlur={(e) => {
                        setRawInputs(r => ({ ...r, traded_price: undefined }))
                        setField('traded_price', parseFloat(e.target.value) || 0)
                      }}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Commission</label>
                    <Input
                      inputMode="decimal"
                      value={rawInputs.commission ?? (form.commission || '')}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (!/^\d*\.?\d*$/.test(raw)) return
                        setRawInputs(r => ({ ...r, commission: raw }))
                        setField('commission', parseFloat(raw) || 0)
                      }}
                      onBlur={(e) => {
                        setRawInputs(r => ({ ...r, commission: undefined }))
                        setField('commission', parseFloat(e.target.value) || 0)
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">VAT</label>
                    <Input
                      inputMode="decimal"
                      value={rawInputs.vat ?? (form.vat || '')}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (!/^\d*\.?\d*$/.test(raw)) return
                        setRawInputs(r => ({ ...r, vat: raw }))
                        setField('vat', parseFloat(raw) || 0)
                      }}
                      onBlur={(e) => {
                        setRawInputs(r => ({ ...r, vat: undefined }))
                        setField('vat', parseFloat(e.target.value) || 0)
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Gross Amount</label>
                    <Input
                      inputMode="decimal"
                      value={rawInputs.gross_amount ?? (form.gross_amount || '')}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (!/^\d*\.?\d*$/.test(raw)) return
                        setRawInputs(r => ({ ...r, gross_amount: raw }))
                        setField('gross_amount', parseFloat(raw) || 0)
                      }}
                      onBlur={(e) => {
                        setRawInputs(r => ({ ...r, gross_amount: undefined }))
                        setField('gross_amount', parseFloat(e.target.value) || 0)
                      }}
                      placeholder="0.00"
                      className="text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Net Amount</span>
                  <span className="text-base font-semibold tabular-nums">
                    ${form.net_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </span>
                </div>
              </div>

            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
              Cancel
            </Button>
            <Button type="submit" form="tx-form" disabled={createTx.isPending || updateTx.isPending}>
              {(createTx.isPending || updateTx.isPending) ? 'Saving...' : editingTx ? 'Update Transaction' : 'Save Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className={`text-[11px] uppercase tracking-wider whitespace-nowrap ${
                      h.column.getCanSort() ? 'cursor-pointer select-none hover:text-foreground' : ''
                    }`}
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
                  <TableRow key={row.id} className="hover:bg-muted/20 transition-colors border-b border-border/50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Page {page} of {totalPages} · {data?.total} transactions
            </span>
            <div className="flex gap-1">
              <button
                className="px-3 py-1.5 rounded-md border border-border text-xs transition-colors cursor-pointer hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <button
                className="px-3 py-1.5 rounded-md border border-border text-xs transition-colors cursor-pointer hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
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
