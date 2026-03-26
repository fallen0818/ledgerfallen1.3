import { supabase } from '../lib/supabase'
import { getCurrentMonth, convertToDatabaseMonth } from '../utils/date'

interface Budget {
  id: string
  user_id: string
  category: string
  amount: number
  month: string
  year?: number
}

/**
 * Fetch budgets for a given month.
 * @param {string} [month] — 'YYYY-MM'
 */
export async function getBudgets(month = getCurrentMonth()): Promise<Budget[]> {
  const dbMonth = convertToDatabaseMonth(month)
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('month', dbMonth)
  if (error) throw error
  return data || []
}

/**
 * Fetch budgets for a specific user and month.
 * @param {string} userId — user ID
 * @param {string} [month] — 'YYYY-MM'
 */
export async function getUserBudgets(userId: string, month = getCurrentMonth()): Promise<Budget[]> {
  const dbMonth = convertToDatabaseMonth(month)
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', dbMonth)
  if (error) throw error
  return data || []
}

/**
 * Extract year from month string (YYYY-MM format)
 * @param {string} month - 'YYYY-MM' format
 * @returns {number} - The year as a number
 */
function extractYearFromMonth(month: string): number {
  return parseInt(month.split('-')[0])
}

/**
 * Upsert (create or update) a budget entry for a category.
 * @param {{ user_id: string, category: string, amount: number, month: string }} budget
 */
export async function upsertBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
  const dbMonth = convertToDatabaseMonth(budget.month)
  const year = extractYearFromMonth(budget.month)

  // First try to find existing budget
  const { data: existingBudget, error: findError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', budget.user_id)
    .eq('category', budget.category)
    .eq('month', dbMonth)
    .single()

  if (findError && findError.code !== 'PGRST116') {
    // PGRST116 means no rows found, which is expected
    throw findError
  }

  if (existingBudget) {
    // Update existing budget
    const { data, error } = await supabase
      .from('budgets')
      .update({ ...budget, month: dbMonth, year })
      .eq('id', existingBudget.id)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Create new budget
    const { data, error } = await supabase
      .from('budgets')
      .insert([{ ...budget, month: dbMonth, year }])
      .select()
      .single()

    if (error) throw error
    return data
  }
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
  const dbMonth = convertToDatabaseMonth(month)
  const { data, error } = await supabase
    .from('budgets')
    .select('amount', { count: 'exact' })
    .eq('user_id', userId)
    .eq('month', dbMonth)

  if (error) throw error

  if (!data || data.length === 0) {
    return 0
  }

  return data.reduce((sum, budget) => sum + parseFloat(budget.amount), 0)
}

/**
 * Fetch budget categories, amounts, and months for a user.
 * @param {string} userId — user ID
 * @param {string} [month] — 'YYYY-MM' (optional, if not provided gets all months)
 */
export async function getBudgetCategories(userId: string, month?: string): Promise<Array<{ category: string; amount: string; month: string }>> {
  let query = supabase
    .from('budgets')
    .select('category, amount, month')
    .eq('user_id', userId)

  if (month) {
    const dbMonth = convertToDatabaseMonth(month)
    query = query.eq('month', dbMonth)
  }

  const { data, error } = await query

  if (error) throw error

  // Sort manually to avoid complex query parameters
  if (data) {
    return data.sort((a, b) => {
      if (a.month !== b.month) {
        return b.month.localeCompare(a.month) // descending by month
      }
      return a.category.localeCompare(b.category) // ascending by category
    })
  }

  return []
}

/**
 * Fetch budgets for a specific user and year.
 * @param {string} userId — user ID
 * @param {number} year — calendar year
 */
export async function getUserBudgetsByYear(userId: string, year: number): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
  if (error) throw error
  return data || []
}

/**
 * Get total budget for a year by summing all categories and months.
 * @param {string} userId — user ID
 * @param {number} year — calendar year
 */
export async function getTotalBudgetByYear(userId: string, year: number): Promise<number> {
  const { data, error } = await supabase
    .from('budgets')
    .select('amount', { count: 'exact' })
    .eq('user_id', userId)
    .eq('year', year)

  if (error) throw error

  if (!data || data.length === 0) {
    return 0
  }

  return data.reduce((sum, budget) => sum + parseFloat(budget.amount), 0)
}
