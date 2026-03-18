import { supabase } from '../lib/supabase'
import { getCurrentMonth, getMonthRange } from '../utils/date'

/**
 * Fetch all transactions for the current user in a given month.
 * @param {string} [month] — 'YYYY-MM', defaults to current month
 */
export async function getTransactions(month = getCurrentMonth()) {
  const { start, end } = getMonthRange(month)
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('transaction_date', start)
    .lte('transaction_date', end)
    .order('transaction_date', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Fetch transactions with advanced filters.
 * @param {{ id?: string, startDate?: string, endDate?: string, category_name?: string, type?: string }} filters
 */
export async function getFilteredTransactions(filters = {}) {
  let query = supabase.from('transactions').select('*')

  if (filters.id) {
    query = query.eq('id', filters.id)
  }
  if (filters.startDate) {
    query = query.gte('transaction_date', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('transaction_date', filters.endDate)
  }
  if (filters.category_name && filters.category_name !== 'All') {
    query = query.eq('category_name', filters.category_name)
  }
  if (filters.type && filters.type !== 'All') {
    query = query.eq('type', filters.type)
  }

  const { data, error } = await query.order('transaction_date', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Fetch ALL transactions for the current user (no date filter).
 */
export async function getAllTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Insert a new transaction record.
 * @param {{ amount: number, category_name: string, transaction_date: string, type: string, description: string, user_email: string }} transaction
 */
export async function createTransaction(transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Update an existing transaction record.
 * @param {string} id
 * @param {Partial<{ amount: number, category_name: string, transaction_date: string, type: string, description: string, user_email: string }>} updates
 */
export async function updateTransaction(id, updates) {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Delete a transaction by ID.
 * @param {string} id
 */
export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}
