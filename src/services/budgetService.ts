import { supabase } from '../lib/supabase'
import { getCurrentMonth } from '../utils/date'

interface Budget {
  id: string
  user_id: string
  category: string
  amount: string
  month: string
}

/**
 * Fetch budgets for a given month.
 * @param {string} [month] — 'YYYY-MM'
 */
export async function getBudgets(month = getCurrentMonth()): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('month', month)
  if (error) throw error
  return data || []
}

/**
 * Fetch budgets for a specific user and month.
 * @param {string} userId — user ID
 * @param {string} [month] — 'YYYY-MM'
 */
export async function getUserBudgets(userId: string, month = getCurrentMonth()): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
  if (error) throw error
  return data || []
}

/**
 * Upsert (create or update) a budget entry for a category.
 * @param {{ user_id: string, category: string, amount: number, month: string }} budget
 */
export async function upsertBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .upsert([budget], { onConflict: 'category,month' })
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Delete a budget by ID.
 * @param {string} id
 */
export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id)
  if (error) throw error
}

/**
 * Get total budget for a month by summing all categories.
 * @param {string} userId — user ID
 * @param {string} [month] — 'YYYY-MM'
 */
export async function getTotalBudget(userId: string, month = getCurrentMonth()): Promise<number> {
  const { data, error } = await supabase
    .from('budgets')
    .select('amount')
    .eq('user_id', userId)
    .eq('month', month)

  if (error) throw error

  if (!data || data.length === 0) {
    return 0
  }

  return data.reduce((sum, budget) => sum + parseFloat(budget.amount), 0)
}
