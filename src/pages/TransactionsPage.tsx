import { useState, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useTransactions, useImportCsv, useCreateTransaction, useDeleteTransaction } from '@/hooks/useTransactions'
import type { Transaction, CreateTransactionRequest, TransactionAction } from '@/types'

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}

function fmtDate(raw: string) {
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'trade_date',
    header: 'Date',
    cell: ({ getValue }) => (
      <span className="text-[#9997aa] text-xs">{fmtDate(getValue() as string)}</span>
    ),
  },
  {
    accessorKey: 'action',
    header: 'Type',
    cell: ({ getValue }) => {
      const v = getValue() as string
      return (
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            v === 'BUY'
              ? 'bg-[#034d34] text-[#34d399]'
              : 'bg-[#450a0a] text-[#f87171]'
          }`}
        >
          {v}
        </span>
      )
    },
  },
  {
    id: 'asset',
    header: 'Asset',
    accessorFn: (r) => r.symbol,
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-[#e8e6f0]">{row.original.symbol}</div>
        <div className="text-xs text-[#5e5c6e] truncate max-w-48">{row.original.company_name}</div>
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
    accessorFn: (r) => r.id,
    cell: ({ getValue }) => <DeleteButton id={getValue() as string} />,
  },
]

function DeleteButton({ id }: { id: string }) {
  const del = useDeleteTransaction()
  return (
    <button
      onClick={() => del.mutate(id)}
      disabled={del.isPending}
      className="text-[#5e5c6e] hover:text-[#f87171] text-xs transition-colors disabled:opacity-50"
    >
      ✕
    </button>
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) importCsv.mutate(file)
    e.target.value = ''
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTx.mutate(form, { onSuccess: () => { setShowForm(false); setForm(EMPTY_FORM) } })
  }

  const setField = <K extends keyof CreateTransactionRequest>(k: K, v: CreateTransactionRequest[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl p-5">
          <div className="text-xs text-[#5e5c6e] uppercase tracking-wider mb-1">Total Transactions</div>
          <div className="text-2xl font-semibold text-[#e8e6f0]">{data?.total ?? '—'}</div>
        </div>
        <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl p-5">
          <div className="text-xs text-[#5e5c6e] uppercase tracking-wider mb-1">Buys</div>
          <div className="text-2xl font-semibold text-[#34d399]">
            {data?.data.filter((t) => t.action === 'BUY').length ?? '—'}
          </div>
        </div>
        <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl p-5">
          <div className="text-xs text-[#5e5c6e] uppercase tracking-wider mb-1">Sells</div>
          <div className="text-2xl font-semibold text-[#f87171]">
            {data?.data.filter((t) => t.action === 'SELL').length ?? '—'}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(['', 'BUY', 'SELL'] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setActionFilter(v); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                actionFilter === v
                  ? 'bg-[#7c6dfa]/20 text-[#a99ffc]'
                  : 'text-[#9997aa] hover:bg-[#1e1e28]'
              }`}
            >
              {v || 'All'}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setSymbolFilter(symbolInput.trim().toUpperCase()); setPage(1) }}
          className="flex gap-1"
        >
          <input
            type="text"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            placeholder="Filter asset…"
            className="bg-[#22222e] border border-[#2e2e3a] rounded-lg px-3 py-1.5 text-xs text-[#e8e6f0] placeholder:text-[#5e5c6e] focus:outline-none focus:border-[#7c6dfa] w-36 transition-colors"
          />
          {symbolFilter && (
            <button
              type="button"
              onClick={() => { setSymbolFilter(''); setSymbolInput(''); setPage(1) }}
              className="px-2 py-1.5 text-xs text-[#5e5c6e] hover:text-[#e8e6f0] transition-colors"
            >
              ✕
            </button>
          )}
        </form>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importCsv.isPending}
            className="px-3 py-1.5 bg-[#1e1e28] border border-[#2e2e3a] hover:border-[#7c6dfa] text-[#9997aa] hover:text-[#e8e6f0] text-xs rounded-lg transition-colors disabled:opacity-50"
          >
            {importCsv.isPending ? 'Importing…' : '↑ Import CSV'}
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-3 py-1.5 bg-[#7c6dfa] hover:bg-[#9488fb] text-white text-xs rounded-lg transition-colors"
          >
            + Add Transaction
          </button>
        </div>
      </div>

      {/* Import success/error */}
      {importCsv.isSuccess && (
        <div className="px-4 py-2 bg-[#034d34] text-[#34d399] text-sm rounded-lg">
          CSV imported successfully.
        </div>
      )}
      {importCsv.isError && (
        <div className="px-4 py-2 bg-[#450a0a] text-[#f87171] text-sm rounded-lg">
          Import failed. Check the CSV format.
        </div>
      )}

      {/* Manual entry form */}
      {showForm && (
        <form
          onSubmit={handleFormSubmit}
          className="bg-[#17171f] border border-[#2e2e3a] rounded-xl p-6 grid grid-cols-3 gap-4"
        >
          <div className="col-span-3 text-sm font-medium text-[#e8e6f0] mb-1">New Transaction</div>
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
            <div key={key}>
              <label className="block text-xs text-[#9997aa] mb-1">{label}</label>
              <input
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
                className="w-full bg-[#22222e] border border-[#2e2e3a] rounded-lg px-3 py-2 text-sm text-[#e8e6f0] focus:outline-none focus:border-[#7c6dfa] transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-[#9997aa] mb-1">Action</label>
            <select
              value={form.action}
              onChange={(e) => setField('action', e.target.value as TransactionAction)}
              className="w-full bg-[#22222e] border border-[#2e2e3a] rounded-lg px-3 py-2 text-sm text-[#e8e6f0] focus:outline-none focus:border-[#7c6dfa]"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div className="col-span-3 flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createTx.isPending}
              className="px-4 py-2 bg-[#7c6dfa] hover:bg-[#9488fb] disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              {createTx.isPending ? 'Saving…' : 'Save Transaction'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="px-4 py-2 text-sm text-[#9997aa] hover:text-[#e8e6f0] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-[#2e2e3a]">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className={`px-4 py-3 text-left text-xs text-[#5e5c6e] uppercase tracking-wider font-medium whitespace-nowrap ${
                        h.column.getCanSort() ? 'cursor-pointer select-none hover:text-[#9997aa]' : ''
                      }`}
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getCanSort() && (
                          <span className="text-[#3e3e4e]">
                            {h.column.getIsSorted() === 'asc' ? '↑' : h.column.getIsSorted() === 'desc' ? '↓' : '↕'}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#2e2e3a]/50">
                      {columns.map((_, ci) => (
                        <td key={ci} className="px-4 py-3">
                          <div className="h-4 bg-[#22222e] rounded animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#2e2e3a]/50 hover:bg-[#1e1e28] transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-[#e8e6f0] whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2e2e3a] text-xs text-[#9997aa]">
            <span>
              Page {page} of {totalPages} · {data?.total} transactions
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 rounded bg-[#22222e] disabled:opacity-40 hover:bg-[#2e2e3a] transition-colors"
              >
                ‹
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 rounded bg-[#22222e] disabled:opacity-40 hover:bg-[#2e2e3a] transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
