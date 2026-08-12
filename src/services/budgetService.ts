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

const TOTAL_SENTINEL = 'Total'
const TOTAL_REVENUE_SENTINEL = 'Total Revenue'

/**
 * Extract year from month string (YYYY-MM format)
 * @param {string} month - 'YYYY-MM' format
 * @returns {number} - The year as a number
 */
function extractYearFromMonth(month: string): number {
  return parseInt(month.split('-')[0])
}

/**
 * Fetch budgets for a given month.
 * IMPORTANT: month names repeat every year ("Aug" 2025 and "Aug" 2026 are
 * both stored as "Aug"), so every query here also filters by year — without
 * it, budgets from different years sharing a month name get merged together.
 * @param {string} [month] — 'YYYY-MM'
 */
export async function getBudgets(month = getCurrentMonth()): Promise<Budget[]> {
  const dbMonth = convertToDatabaseMonth(month)
  const year = extractYearFromMonth(month)
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('month', dbMonth)
    .eq('year', year)
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
  const year = extractYearFromMonth(month)
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', dbMonth)
    .eq('year', year)
  if (error) throw error
  return data || []
}

/**
 * Upsert (create or update) a budget entry for a category.
 * Pass category: 'Total' to set the overall month budget limit (kept
 * separate from per-category rows — see getTotalBudget).
 * @param {{ user_id: string, category: string, amount: number, month: string }} budget
 */
export async function upsertBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
  const dbMonth = convertToDatabaseMonth(budget.month)
  const year = extractYearFromMonth(budget.month)

  // First try to find existing budget — must match year too, or saving a
  // budget for e.g. Aug 2026 would silently overwrite Aug 2025's row.
  const { data: existingBudget, error: findError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', budget.user_id)
    .eq('category', budget.category)
    .eq('month', dbMonth)
    .eq('year', year)
    .maybeSingle()

  if (findError) throw findError

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
 * Get the overall budget LIMIT for a month — this is the single 'Total'
 * row you set via "Edit Budget", not a sum of every category budget too.
 * (Previously this summed every row for the month, which double-counted
 * the Total row together with every per-category row.)
 * @param {string} userId — user ID
 * @param {string} [month] — 'YYYY-MM'
 */
export async function getTotalBudget(userId: string, month = getCurrentMonth()): Promise<number> {
  const dbMonth = convertToDatabaseMonth(month)
  const year = extractYearFromMonth(month)
  const { data, error } = await supabase
    .from('budgets')
    .select('amount')
    .eq('user_id', userId)
    .eq('month', dbMonth)
    .eq('year', year)
    .eq('category', TOTAL_SENTINEL)
    .maybeSingle()

  if (error) throw error
  if (!data) return 0
  return parseFloat(data.amount)
}

/**
 * Fetch budget categories, amounts, and months for a user.
 * Excludes the 'Total' sentinel row — that's the overall limit, not a real
 * spending category, so it shouldn't show up in the category budget list.
 * @param {string} userId — user ID
 * @param {string} [month] — 'YYYY-MM' (optional, if not provided gets all months)
 */
export async function getBudgetCategories(userId: string, month?: string): Promise<Array<{ category: string; amount: string; month: string }>> {
  let query = supabase
    .from('budgets')
    .select('category, amount, month')
    .eq('user_id', userId)
    .neq('category', TOTAL_SENTINEL)
    .neq('category', TOTAL_REVENUE_SENTINEL)

  if (month) {
    const dbMonth = convertToDatabaseMonth(month)
    const year = extractYearFromMonth(month)
    query = query.eq('month', dbMonth).eq('year', year)
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
 * Fetch budgets for a specific user and year (across all months).
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
 * Get the overall budget LIMIT for a full year — the sum of each month's
 * 'Total' row across the year (not every category budget too — same
 * double-counting fix as getTotalBudget, applied across 12 months).
 * @param {string} userId — user ID
 * @param {number} year — calendar year
 */
export async function getTotalBudgetByYear(userId: string, year: number): Promise<number> {
  const { data, error } = await supabase
    .from('budgets')
    .select('amount')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('category', TOTAL_SENTINEL)

  if (error) throw error

  if (!data || data.length === 0) {
    return 0
  }

  return data.reduce((sum, budget) => sum + parseFloat(budget.amount), 0)
}

/**
 * Get the Revenue TARGET for a month — mirrors getTotalBudget, but for
 * revenue instead of expense. Stored as its own sentinel category
 * ('Total Revenue') so it never gets confused with the expense budget or
 * counted as a real spending category.
 * @param {string} userId — user ID
 * @param {string} [month] — 'YYYY-MM'
 */
export async function getTotalRevenueBudget(userId: string, month = getCurrentMonth()): Promise<number> {
  const dbMonth = convertToDatabaseMonth(month)
  const year = extractYearFromMonth(month)
  const { data, error } = await supabase
    .from('budgets')
    .select('amount')
    .eq('user_id', userId)
    .eq('month', dbMonth)
    .eq('year', year)
    .eq('category', TOTAL_REVENUE_SENTINEL)
    .maybeSingle()

  if (error) throw error
  if (!data) return 0
  return parseFloat(data.amount)
}

/**
 * Get the Revenue TARGET for a full year — sum of each month's Revenue
 * target row across the year. Mirrors getTotalBudgetByYear.
 * @param {string} userId — user ID
 * @param {number} year — calendar year
 */
export async function getTotalRevenueBudgetByYear(userId: string, year: number): Promise<number> {
  const { data, error } = await supabase
    .from('budgets')
    .select('amount')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('category', TOTAL_REVENUE_SENTINEL)

  if (error) throw error

  if (!data || data.length === 0) {
    return 0
  }

  return data.reduce((sum, budget) => sum + parseFloat(budget.amount), 0)
}
