import { useState, useEffect, useCallback } from 'react'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactionService'
import { getCurrentMonth } from '../utils/date'

interface Transaction {
  id: string
  amount: string
  description: string
  transaction_date: string
  type_id: string
  category_id: string
  created_at: string
  category_name: string
  type: string
  user_email: string
  [key: string]: any
}

interface TransactionData {
  amount: string
  description: string
  transaction_date: string
  type_id: string
  category_id: string
  category_name: string
  type: string
  user_email: string
}

/**
 * Hook for managing transactions with optimistic updates.
 * @param {string} [month] — 'YYYY-MM'
 */
export function useTransactions(month: string = getCurrentMonth()) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTransactions(month)
      setTransactions(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Optimistic add transaction
  const addTransaction = useCallback(async (transactionData: TransactionData) => {
    // Create a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`
    const optimisticTx: Transaction = {
      id: tempId,
      ...transactionData,
      created_at: new Date().toISOString(),
      category_name: '', // Will be filled by server
      type: '', // Will be filled by server
      user_email: '', // Will be filled by server
    }

    // Optimistically add to the list
    setTransactions(prev => [optimisticTx, ...prev])

    try {
      const created = await createTransaction(transactionData)
      // Replace the optimistic entry with the real one from the server
      setTransactions(prev =>
        prev.map(t => t.id === tempId ? created : t) as Transaction[]
      )
      return created
    } catch (err) {
      // Rollback on error
      setTransactions(prev => prev.filter(t => t.id !== tempId))
      throw err
    }
  }, [])

  // Optimistic edit transaction
  const editTransaction = useCallback(async (id: string, updates: Partial<TransactionData>) => {
    // Store the original for rollback
    let originalTx: Transaction | null = null
    setTransactions(prev => {
      const tx = prev.find(t => t.id === id)
      if (tx) originalTx = { ...tx }
      return prev.map(t => t.id === id ? { ...t, ...updates } : t) as Transaction[]
    })

    try {
      const updated = await updateTransaction(id, updates)
      setTransactions(prev =>
        prev.map(t => t.id === id ? updated : t) as Transaction[]
      )
      return updated
    } catch (err) {
      // Rollback on error
      if (originalTx) {
        setTransactions(prev =>
          prev.map(t => t.id === id ? originalTx : t) as Transaction[]
        )
      }
      throw err
    }
  }, [])

  // Optimistic delete transaction
  const removeTransaction = useCallback(async (id: string) => {
    // Store the transaction for rollback
    let deletedTx: Transaction | null = null
    setTransactions(prev => {
      const tx = prev.find(t => t.id === id)
      if (tx) deletedTx = { ...tx }
      return prev.filter(t => t.id !== id)
    })

    try {
      await deleteTransaction(id)
    } catch (err) {
      // Rollback on error
      if (deletedTx) {
        setTransactions(prev => [deletedTx, ...prev].sort((a, b) => {
          if (!a || !b) return 0
          const dateA = new Date(a.transaction_date)
          const dateB = new Date(b.transaction_date)
          return dateB.getTime() - dateA.getTime()
        }) as Transaction[])
      }
      throw err
    }
  }, [])

  return { transactions, loading, error, addTransaction, editTransaction, removeTransaction, refetch: fetchTransactions }
}
