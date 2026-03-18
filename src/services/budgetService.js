import { supabase } from '../lib/supabase'
import { getCurrentMonth } from '../utils/date'

/**
 * Fetch budgets for a given month.
 * @param {string} [month] — 'YYYY-MM'
 */
export async function getBudgets(month = getCurrentMonth()) {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('month', month)
  if (error) throw error
  return data
}

/**
 * Upsert (create or update) a budget entry for a category.
 * @param {{ category: string, amount: number, month: string }} budget
 */
export async function upsertBudget(budget) {
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
export async function deleteBudget(id) {
  const { error } = await supabase.from('budgets').delete().eq('id', id)
  if (error) throw error
}
