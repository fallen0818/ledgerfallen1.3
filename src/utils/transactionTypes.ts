/**
 * Shared transaction type classification.
 *
 * IMPORTANT: this app's `types` table isn't limited to income/expense — it
 * also includes Assets, Equities, and Liabilities (balance-sheet items).
 * Any transaction whose type isn't recognized as revenue or expense falls
 * through to `isOtherType`, so it's still accounted for somewhere rather
 * than silently vanishing from totals.
 *
 * This used to be duplicated (with slightly different logic each time)
 * across DashboardPage, ReportsPage, VarianceReport, RevenueExpenseReport,
 * and TransactionList — centralizing it here means it can't drift out of
 * sync between pages again.
 */

const REVENUE_TYPES = ['income', 'revenue', 'earning', 'earnings']
const EXPENSE_TYPES = ['expense', 'spending', 'cost', 'costs']

export function isRevenueType(type: string | null | undefined): boolean {
  return REVENUE_TYPES.includes((type || '').toLowerCase())
}

export function isExpenseType(type: string | null | undefined): boolean {
  return EXPENSE_TYPES.includes((type || '').toLowerCase())
}

/**
 * True for anything that isn't recognized as revenue or expense —
 * e.g. Assets, Equities, Liabilities. Use this to make sure such
 * transactions are shown/counted somewhere instead of disappearing.
 */
export function isOtherType(type: string | null | undefined): boolean {
  return !isRevenueType(type) && !isExpenseType(type)
}