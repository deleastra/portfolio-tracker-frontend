import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionApi } from '@/lib/apiClient'
import type { CreateTransactionRequest } from '@/types'

export function useTransactions(params?: {
  page?: number
  page_size?: number
  action?: string
  symbol?: string
}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => transactionApi.list(params),
    staleTime: 10_000,
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTransactionRequest) => transactionApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['portfolio'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transactionApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['portfolio'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useImportCsv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => transactionApi.importCsv(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['portfolio'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}
