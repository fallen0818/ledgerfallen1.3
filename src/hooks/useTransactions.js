import { useState, useEffect, useCallback } from 'react'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactionService'
import { getCurrentMonth } from '../utils/date'

/**
 * Hook for managing transactions.
 * @param {string} [month] — 'YYYY-MM'
 */
export function useTransactions(month = getCurrentMonth()) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTransactions(month)
      setTransactions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const addTransaction = useCallback(async (transactionData) => {
    const created = await createTransaction(transactionData)
    setTransactions((prev) => [created, ...prev])
    return created
  }, [])

  const editTransaction = useCallback(async (id, updates) => {
    const updated = await updateTransaction(id, updates)
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }, [])

  const removeTransaction = useCallback(async (id) => {
    await deleteTransaction(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { transactions, loading, error, addTransaction, editTransaction, removeTransaction, refetch: fetchTransactions }
}
