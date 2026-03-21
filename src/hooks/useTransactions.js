import { useState, useEffect, useCallback } from 'react'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactionService'
import { getCurrentMonth } from '../utils/date'

/**
 * Hook for managing transactions with optimistic updates.
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

  // Optimistic add transaction
  const addTransaction = useCallback(async (transactionData) => {
    // Create a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`
    const optimisticTx = {
      id: tempId,
      ...transactionData,
      created_at: new Date().toISOString(),
    }

    // Optimistically add to the list
    setTransactions(prev => [optimisticTx, ...prev])

    try {
      const created = await createTransaction(transactionData)
      // Replace the optimistic entry with the real one from the server
      setTransactions(prev =>
        prev.map(t => t.id === tempId ? created : t)
      )
      return created
    } catch (err) {
      // Rollback on error
      setTransactions(prev => prev.filter(t => t.id !== tempId))
      throw err
    }
  }, [])

  // Optimistic edit transaction
  const editTransaction = useCallback(async (id, updates) => {
    // Store the original for rollback
    let originalTx = null
    setTransactions(prev => {
      const tx = prev.find(t => t.id === id)
      if (tx) originalTx = { ...tx }
      return prev.map(t => t.id === id ? { ...t, ...updates } : t)
    })

    try {
      const updated = await updateTransaction(id, updates)
      setTransactions(prev =>
        prev.map(t => t.id === id ? updated : t)
      )
      return updated
    } catch (err) {
      // Rollback on error
      if (originalTx) {
        setTransactions(prev =>
          prev.map(t => t.id === id ? originalTx : t)
        )
      }
      throw err
    }
  }, [])

  // Optimistic delete transaction
  const removeTransaction = useCallback(async (id) => {
    // Store the transaction for rollback
    let deletedTx = null
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
        setTransactions(prev => [deletedTx, ...prev].sort((a, b) =>
          new Date(b.transaction_date) - new Date(a.transaction_date)
        ))
      }
      throw err
    }
  }, [])

  return { transactions, loading, error, addTransaction, editTransaction, removeTransaction, refetch: fetchTransactions }
}
