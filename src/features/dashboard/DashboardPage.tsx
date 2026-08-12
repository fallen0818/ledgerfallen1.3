import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactions } from '../../hooks/useTransactions'
import { useAuth } from '../../hooks/useAuth'
import { Card } from '../../components/Shared/Card'
import { StatCardSkeleton } from '../../components/Shared/Skeleton'
import { formatCurrency } from '../../utils/currency'
import { getCurrentMonth, getYearRange, getYearsRange } from '../../utils/date'
import { getTotalBudget, getTotalBudgetByYear, getBudgetCategories, upsertBudget } from '../../services/budgetService'
import { getTransactions } from '../../services/transactionService'
import { TrendChart } from './TrendChart'
import { isRevenueType, isExpenseType, isOtherType } from '../../utils/transactionTypes'
import './DashboardPage.css'

interface Transaction {
  id: string
  amount: number | string
  description: string
  transaction_date: string
  type_id: string
  category_id: string
  created_at: string
  category_name: string
  type: string
  user_email: string
}

function StatCard({ label, value, sub, accent, positive, icon }: { label: string; value: string | number; sub?: string; accent?: boolean; positive?: boolean; icon?: string }) {
  return (
    <Card className={`stat-card ${accent ? 'stat-card--accent' : ''}`}>
      <div className="stat-card__header">
        {icon && <span className="stat-card__icon">{icon}</span>}
        <p className="stat-card__label">{label}</p>
      </div>
      <p className={`stat-card__value ${positive ? 'stat-card__value--positive' : ''}`}>{value}</p>
      {sub && <p className="stat-card__sub">{sub}</p>}
    </Card>
  )
}

function TrendCard({ title, data, onItemClick, comparisonMode, onComparisonModeChange }: {
  title: string
  data: { label: string; value: number; change: number }[]
  onItemClick?: (label: string) => void
  comparisonMode?: 'previous' | 'yoy'
  onComparisonModeChange?: (mode: 'previous' | 'yoy') => void
}) {
  return (
    <Card className="trend-card">
      <div className="trend-card__header">
        <h3 className="trend-card__title">{title}</h3>
        {onComparisonModeChange && (
          <div className="trend-card__toggle-wrap">
            <span className="trend-card__toggle-label">Compare:</span>
            <div className="trend-card__toggle">
              <button
                className={`trend-card__toggle-btn ${comparisonMode === 'previous' ? 'trend-card__toggle-btn--active' : ''}`}
                onClick={() => onComparisonModeChange('previous')}
              >
                vs Last Month
              </button>
              <button
                className={`trend-card__toggle-btn ${comparisonMode === 'yoy' ? 'trend-card__toggle-btn--active' : ''}`}
                onClick={() => onComparisonModeChange('yoy')}
              >
                vs Last Year
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="trend-card__list">
        {data.map((item, index) => (
          <div
            key={index}
            className={`trend-item ${onItemClick ? 'trend-item--clickable' : ''}`}
            onClick={onItemClick ? () => onItemClick(item.label) : undefined}
            title={onItemClick ? `View ${item.label} transactions` : undefined}
          >
            <div className="trend-item__info">
              <span className="trend-item__label">{item.label}</span>
              <span className="trend-item__value">{formatCurrency(item.value)}</span>
            </div>
            <div className={`trend-item__change ${item.change >= 0 ? 'trend-item__change--positive' : 'trend-item__change--negative'}`}>
              {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change)}%
            </div>
            {onItemClick && <span className="trend-item__arrow">→</span>}
          </div>
        ))}
      </div>
    </Card>
  )
}

const DEFAULT_BUDGET = 2000

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const handleCategoryClick = (category: string) => {
    navigate(`/expenses?search=${encodeURIComponent(category)}`)
  }
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const yearRange = getYearRange()
  const yearsRange = getYearsRange()

  // Determine the date range based on timeframe
  const dateRange = timeframe === 'monthly' ? selectedMonth : selectedYear.toString()

  const { transactions = [], loading: txLoading = true } = useTransactions(dateRange)
  const [monthlyBudget, setMonthlyBudget] = useState(DEFAULT_BUDGET)
  const [loading, setLoading] = useState(true)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState(DEFAULT_BUDGET.toString())
  const [isEditingCategoryBudgets, setIsEditingCategoryBudgets] = useState(false)
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({})
  const [previousPeriodBreakdown, setPreviousPeriodBreakdown] = useState<Record<string, number>>({})
  const [yearOverYearBreakdown, setYearOverYearBreakdown] = useState<Record<string, number>>({})
  const [comparisonMode, setComparisonMode] = useState<'previous' | 'yoy'>('previous')
  const [monthlyTrend, setMonthlyTrend] = useState<{ monthLabel: string; expense: number; revenue: number }[]>([])

  const isRevenue = (t: Transaction) => isRevenueType(t.type)
  const isExpense = (t: Transaction) => isExpenseType(t.type)
  const isOther = (t: Transaction) => isOtherType(t.type)

  // Fetch the last 6 months of Expense/Revenue totals for the trend chart.
  // Independent of the Monthly/Yearly toggle above — always shows a rolling
  // 6-month view regardless of what period is currently selected.
  useEffect(() => {
    if (!user?.id) return
    async function loadTrend() {
      try {
        const now = new Date()
        const months: string[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
        }

        const results = await Promise.all(months.map((m) => getTransactions(m)))

        const trend = months.map((m, idx) => {
          const [y, mo] = m.split('-').map(Number)
          const monthLabel = new Date(y, mo - 1, 1).toLocaleString('en-US', { month: 'short' })
          const txs = results[idx] as unknown as Transaction[]
          const expense = txs.filter(isExpense).reduce((sum, t) => sum + Number(t.amount), 0)
          const revenue = txs.filter(isRevenue).reduce((sum, t) => sum + Number(t.amount), 0)
          return { monthLabel, expense, revenue }
        })

        setMonthlyTrend(trend)
      } catch (err) {
        console.error('Error loading monthly trend:', err)
        setMonthlyTrend([])
      }
    }
    loadTrend()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Fetch budget and categories from services
  useEffect(() => {
    if (!user?.id) return
    async function fetchData() {
      try {
        // Yearly view needs the year-based functions — passing a bare year
        // string like "2026" into the month-based ones silently breaks
        // (they expect "YYYY-MM" and would parse NaN out of "2026").
        const total = timeframe === 'yearly'
          ? await getTotalBudgetByYear(user!.id, selectedYear)
          : await getTotalBudget(user!.id, dateRange)

        if (total > 0) {
          setMonthlyBudget(total)
          setBudgetInput(total.toString())
        } else {
          // No budget set, use default
          setMonthlyBudget(DEFAULT_BUDGET)
          setBudgetInput(DEFAULT_BUDGET.toString())
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [dateRange, timeframe, selectedYear, user?.id])

  // Initialize category budgets with existing data — only meaningful in
  // Monthly view; per-category budgets are set per specific month, and
  // there's no defined "yearly category budget" in this schema.
  useEffect(() => {
    if (!user?.id) return
    if (timeframe === 'yearly') {
      setCategoryBudgets({})
      return
    }
    async function loadCategoryBudgets() {
      try {
        const budgets = await getBudgetCategories(user!.id, dateRange)
        const budgetMap: Record<string, number> = {}
        budgets.forEach(budget => {
          budgetMap[budget.category] = parseFloat(budget.amount)
        })
        setCategoryBudgets(budgetMap)
      } catch (err) {
        console.error('Error loading category budgets:', err)
      }
    }
    loadCategoryBudgets()
  }, [dateRange, timeframe, user?.id])

  // Fetch previous period data for real trend comparison
  useEffect(() => {
    async function loadPreviousPeriod() {
      try {
        let prevRange: string
        if (timeframe === 'monthly') {
          const [y, m] = selectedMonth.split('-').map(Number)
          const prevMonth = m === 1 ? 12 : m - 1
          const prevYear = m === 1 ? y - 1 : y
          prevRange = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
        } else {
          prevRange = (selectedYear - 1).toString()
        }
        const prevTransactions = await getTransactions(prevRange)
        const breakdown: Record<string, number> = {}
        prevTransactions
          .filter((t: any) => isExpenseType(t.type))
          .forEach((tx: any) => {
            const category = tx.category_name || 'Uncategorized'
            breakdown[category] = (breakdown[category] || 0) + Number(tx.amount)
          })
        setPreviousPeriodBreakdown(breakdown)
      } catch (err) {
        // Silently fail — previous period data is supplementary
        setPreviousPeriodBreakdown({})
      }
    }
    loadPreviousPeriod()
  }, [timeframe, selectedMonth, selectedYear])

  // Fetch same-month-last-year data for the YoY comparison toggle.
  // Only meaningful in Monthly view — in Yearly view, "previous period" is
  // already the prior year, so there's nothing extra to compare against.
  useEffect(() => {
    if (timeframe !== 'monthly') {
      setYearOverYearBreakdown({})
      return
    }
    async function loadYearOverYear() {
      try {
        const [y, m] = selectedMonth.split('-').map(Number)
        const lastYearRange = `${y - 1}-${String(m).padStart(2, '0')}`
        const lastYearTransactions = await getTransactions(lastYearRange)
        const breakdown: Record<string, number> = {}
        lastYearTransactions
          .filter((t: any) => isExpenseType(t.type))
          .forEach((tx: any) => {
            const category = tx.category_name || 'Uncategorized'
            breakdown[category] = (breakdown[category] || 0) + Number(tx.amount)
          })
        setYearOverYearBreakdown(breakdown)
      } catch (err) {
        // Silently fail — YoY data is supplementary
        setYearOverYearBreakdown({})
      }
    }
    loadYearOverYear()
  }, [timeframe, selectedMonth])

  const handleBudgetChange = async () => {
    const newBudget = parseFloat(budgetInput)
    if (isNaN(newBudget) || newBudget <= 0) {
      alert('Please enter a valid budget amount')
      return
    }

    try {
      // Persist to Supabase
      if (user?.id) {
        await upsertBudget({
          user_id: user.id,
          category: 'Total',
          amount: newBudget,
          month: dateRange
        })
      }
      // Update local state
      setMonthlyBudget(newBudget)
      setIsEditingBudget(false)
    } catch (err) {
      console.error('Error updating budget:', err)
      alert('Failed to update budget')
    }
  }

  const handleCategoryBudgetChange = (category: string, amount: string) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [category]: parseFloat(amount) || 0
    }))
  }

  const saveCategoryBudgets = async () => {
    if (!user?.id) return
    try {
      // Save each category budget
      for (const [category, amount] of Object.entries(categoryBudgets)) {
        if (amount && amount > 0) {
          await upsertBudget({
            user_id: user.id,
            category,
            amount,
            month: dateRange
          })
        }
      }
      setIsEditingCategoryBudgets(false)
      // Refresh the budget data
      const total = await getTotalBudget(user.id, dateRange)
      setMonthlyBudget(total)
      setBudgetInput(total.toString())
    } catch (err) {
      console.error('Error saving category budgets:', err)
      alert('Failed to save category budgets')
    }
  }

  const totalExpense = transactions
    .filter(isExpense)
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

  const totalRevenue = transactions
    .filter(isRevenue)
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

  // Types like Assets/Equities/Liabilities aren't expense or revenue, but
  // they're still real transactions — track them instead of silently
  // dropping them from every total on this page.
  const otherTransactions = transactions.filter(isOther)
  const totalOther = otherTransactions.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

  const remaining = Math.max(0, monthlyBudget - totalExpense)
  const txCount = transactions.length

  // Calculate category breakdown
  const categoryBreakdown = transactions
    .filter(isExpense)
    .reduce((acc, tx: Transaction) => {
      const category = tx.category_name || 'Uncategorized'
      acc[category] = (acc[category] || 0) + Number(tx.amount)
      return acc
    }, {} as Record<string, number>)

  // Only Monthly view offers a real choice here — in Yearly view, the
  // "previous period" already IS the prior year, so there's nothing to
  // toggle between.
  const activeComparisonBreakdown = (timeframe === 'monthly' && comparisonMode === 'yoy')
    ? yearOverYearBreakdown
    : previousPeriodBreakdown

  const allCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => {
      const prevAmount = activeComparisonBreakdown[category] || 0
      const change = prevAmount > 0
        ? Math.round(((amount - prevAmount) / prevAmount) * 100)
        : (amount > 0 ? 100 : 0)
      return {
        label: category,
        value: amount,
        change
      }
    })

  // Format the display label
  const displayLabel = timeframe === 'monthly'
    ? new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
    : selectedYear.toString()

  // Show skeletons while loading
  if (txLoading || loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__controls">
          <div className="dashboard__timeframe-selector">
            <button
              className={`dashboard__timeframe-btn ${timeframe === 'monthly' ? 'dashboard__timeframe-btn--active' : ''}`}
              onClick={() => setTimeframe('monthly')}
            >
              Monthly
            </button>
            <button
              className={`dashboard__timeframe-btn ${timeframe === 'yearly' ? 'dashboard__timeframe-btn--active' : ''}`}
              onClick={() => setTimeframe('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="dashboard__stats">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <Card className="dashboard__budget-card">
          <h2 className="dashboard__section-title">Budget Overview</h2>
          <div className="dashboard-loading">Loading budget data...</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">Financial Overview</h1>
        <p className="dashboard__subtitle">Comprehensive insights into your financial performance</p>

        <div className="dashboard__controls">
          <div className="dashboard__timeframe-selector">
            <button
              className={`dashboard__timeframe-btn ${timeframe === 'monthly' ? 'dashboard__timeframe-btn--active' : ''}`}
              onClick={() => setTimeframe('monthly')}
            >
              Monthly
            </button>
            <button
              className={`dashboard__timeframe-btn ${timeframe === 'yearly' ? 'dashboard__timeframe-btn--active' : ''}`}
              onClick={() => setTimeframe('yearly')}
            >
              Yearly
            </button>
          </div>

          {timeframe === 'monthly' ? (
            <select
              className="dashboard__month-selector"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {yearRange.map((month: string) => (
                <option key={month} value={month}>
                  {new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          ) : (
            <div className="dashboard__year-controls">
              <label htmlFor="dashboard-year" className="dashboard__year-label">Year</label>
              <input
                id="dashboard-year"
                type="number"
                className="dashboard__year-spinbutton"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                min={yearsRange[yearsRange.length - 1]} // Oldest year (last in reversed array)
                max={yearsRange[0]} // Newest year (first in reversed array)
                step="1"
              />
            </div>
          )}
        </div>
      </div>

      <div className="dashboard__stats">
        <StatCard
          label="Total Expense"
          value={formatCurrency(totalExpense)}
          sub={displayLabel}
          accent={totalExpense > monthlyBudget}
          icon="💸"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          sub={displayLabel}
          positive
          icon="💰"
        />
        <StatCard
          label="Net Balance"
          value={formatCurrency(totalRevenue - totalExpense)}
          sub={displayLabel}
          accent={(totalRevenue - totalExpense) < 0}
          icon={(totalRevenue - totalExpense) >= 0 ? "📈" : "📉"}
        />
        <StatCard
          label="Transactions"
          value={txCount}
          sub={timeframe === 'monthly' ? 'this month' : 'this year'}
          icon="📊"
        />
        {totalOther > 0 && (
          <StatCard
            label="Other Activity"
            value={formatCurrency(totalOther)}
            sub={`${otherTransactions.length} non-expense/revenue entries`}
            icon="📁"
          />
        )}
      </div>

      {monthlyTrend.length > 0 && (
        <Card className="dashboard__trend-card">
          <h2 className="dashboard__section-title">6-Month Trend</h2>
          <TrendChart data={monthlyTrend} />
        </Card>
      )}

      <div className="dashboard__grid">
        <Card className="dashboard__budget-card">
          <h2 className="dashboard__section-title">Budget Performance</h2>
          <div className="budget-overview">
            <div className="budget-header">
              <div className="budget-title">
                <h3 className="budget-title__main">Monthly Budget</h3>
                <span className="budget-title__period">{displayLabel}</span>
              </div>
              <div className="budget-actions">
                {isEditingBudget ? (
                  <div className="budget-edit-controls">
                    <div className="budget-edit-input">
                      <label className="budget-edit-label">Set Budget Limit</label>
                      <div className="budget-edit-field">
                        <span className="budget-currency">₱</span>
                        <input
                          type="number"
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          className="budget-edit-input-field"
                          min="0"
                          step="100"
                          placeholder="0"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="budget-edit-buttons">
                      <button
                        className="budget-btn budget-btn--primary"
                        onClick={handleBudgetChange}
                        disabled={isNaN(parseFloat(budgetInput)) || parseFloat(budgetInput) <= 0}
                      >
                        Save Budget
                      </button>
                      <button
                        className="budget-btn budget-btn--secondary"
                        onClick={() => {
                          setIsEditingBudget(false)
                          setBudgetInput(monthlyBudget.toString())
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : timeframe === 'yearly' ? (
                  <span className="budget-edit-note" title="Budgets are set per month — switch to Monthly to edit">
                    Switch to Monthly to edit budgets
                  </span>
                ) : (
                  <>
                    <button
                      className="budget-edit-trigger"
                      onClick={() => setIsEditingBudget(true)}
                      title="Edit budget limit"
                    >
                      <span className="budget-edit-icon">✏️</span>
                      <span className="budget-edit-text">Edit Budget</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="budget-values">
              <div className="budget-value budget-value--limit">
                <span className="budget-value__label">Budget Limit</span>
                <span className="budget-value__amount">{formatCurrency(monthlyBudget)}</span>
              </div>
              <div className="budget-value budget-value--spent">
                <span className="budget-value__label">Amount Expense</span>
                <span className="budget-value__amount">{formatCurrency(totalExpense)}</span>
              </div>
              <div className="budget-value budget-value--remaining">
                <span className="budget-value__label">Remaining</span>
                <span className="budget-value__amount" style={{
                  color: remaining > 0 ? 'var(--success)' : 'var(--danger)',
                  fontWeight: '800'
                }}>
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Category Budget Management */}
          <div className="budget-categories">
            <div className="budget-categories__header">
              <h4 className="budget-categories__title">Category Budgets</h4>
              <div className="budget-categories__actions">
                {isEditingCategoryBudgets ? (
                  <>
                    <button
                      className="budget-btn budget-btn--primary"
                      onClick={saveCategoryBudgets}
                    >
                      Save Category Budgets
                    </button>
                    <button
                      className="budget-btn budget-btn--secondary"
                      onClick={() => setIsEditingCategoryBudgets(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : timeframe === 'yearly' ? (
                  <span className="budget-edit-note" title="Category budgets are set per month — switch to Monthly to edit">
                    Switch to Monthly to edit
                  </span>
                ) : (
                  <button
                    className="budget-edit-trigger"
                    onClick={() => setIsEditingCategoryBudgets(true)}
                    title="Edit category budgets"
                  >
                    <span className="budget-edit-icon">📋</span>
                    <span className="budget-edit-text">Edit Categories</span>
                  </button>
                )}
              </div>
            </div>

            <div className="budget-categories__list">
              {Object.entries(categoryBreakdown).map(([category, spentAmount]) => (
                <div key={category} className="budget-category-item">
                  <div className="budget-category-info">
                    <span className="budget-category-name">{category}</span>
                    <span className="budget-category-spent">
                      Spent: {formatCurrency(spentAmount)}
                    </span>
                  </div>
                  <div className="budget-category-input">
                    <label className="budget-category-label">Budget</label>
                    <div className="budget-category-field">
                      <span className="budget-currency">₱</span>
                      <input
                        type="number"
                        value={categoryBudgets[category] || ''}
                        onChange={(e) => handleCategoryBudgetChange(category, e.target.value)}
                        className="budget-category-input-field"
                        min="0"
                        step="100"
                        placeholder="0"
                        disabled={!isEditingCategoryBudgets}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="budget-progress">
            <div className="budget-progress__bar">
              <div
                className="budget-progress__fill"
                style={{
                  width: `${Math.min((totalExpense / monthlyBudget) * 100, 100)}%`,
                  backgroundColor: totalExpense > monthlyBudget ? 'var(--danger)' : 'var(--accent)'
                }}
              ></div>
            </div>
            <div className="budget-progress__labels">
              <span>Budget</span>
              <span>{Math.min(Math.round((totalExpense / monthlyBudget) * 100), 100)}%</span>
            </div>
          </div>
        </Card>

        <TrendCard
          title={timeframe === 'monthly' ? "All Expense Categories" : "All Categories This Year"}
          data={allCategories}
          onItemClick={handleCategoryClick}
          comparisonMode={timeframe === 'monthly' ? comparisonMode : undefined}
          onComparisonModeChange={timeframe === 'monthly' ? setComparisonMode : undefined}
        />

        <Card className="dashboard__summary-card">
          <h3 className="dashboard__section-title">Financial Summary</h3>
          <div className="summary-metrics">
            <div className="summary-metric">
              <span className="summary-metric__label">Savings Rate</span>
              <span className="summary-metric__value">
                {totalRevenue > 0 ? Math.round(((totalRevenue - totalExpense) / totalRevenue) * 100).toString() : '0'}%
              </span>
            </div>
            <div className="summary-metric">
              <span className="summary-metric__label">Average Transaction</span>
              <span className="summary-metric__value">
                {txCount > 0 ? formatCurrency((totalRevenue + totalExpense) / txCount) : formatCurrency(0)}
              </span>
            </div>
            <div className="summary-metric">
              <span className="summary-metric__label">Budget Health</span>
              <span className={`summary-metric__value ${remaining > 0 ? 'summary-metric__value--good' : 'summary-metric__value--warning'}`}>
                {remaining > 0 ? 'Healthy' : 'Over Budget'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
