import { useState, useEffect } from 'react'
import { useTransactions } from '../../hooks/useTransactions'
import { Card } from '../../components/Shared/Card'
import { StatCardSkeleton } from '../../components/Shared/Skeleton'
import { formatCurrency, formatNumberWithSeparators } from '../../utils/currency'
import { getCurrentMonth, getYearRange, getYearsRange } from '../../utils/date'
import { getTotalBudget, getBudgetCategories, upsertBudget } from '../../services/budgetService'
import './DashboardPage.css'

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
}

function StatCard({ label, value, sub, accent, icon }: { label: string; value: string | number; sub?: string; accent?: boolean; icon?: string }) {
  return (
    <Card className={`stat-card ${accent ? 'stat-card--accent' : ''}`}>
      <div className="stat-card__header">
        {icon && <span className="stat-card__icon">{icon}</span>}
        <p className="stat-card__label">{label}</p>
      </div>
      <p className="stat-card__value">{value}</p>
      {sub && <p className="stat-card__sub">{sub}</p>}
    </Card>
  )
}

function TrendCard({ title, data }: { title: string; data: { label: string; value: number; change: number }[] }) {
  return (
    <Card className="trend-card">
      <h3 className="trend-card__title">{title}</h3>
      <div className="trend-card__list">
        {data.map((item, index) => (
          <div key={index} className="trend-item">
            <div className="trend-item__info">
              <span className="trend-item__label">{item.label}</span>
              <span className="trend-item__value">{formatCurrency(item.value)}</span>
            </div>
            <div className={`trend-item__change ${item.change >= 0 ? 'trend-item__change--positive' : 'trend-item__change--negative'}`}>
              {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change)}%
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

const DEFAULT_BUDGET = 2000

export function DashboardPage() {
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

  // Fetch budget and categories from services
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch total budget
        const total = await getTotalBudget('f4e2af28-f270-4c19-90a8-81e85280b628', dateRange)

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
  }, [dateRange])

  // Initialize category budgets with existing data
  useEffect(() => {
    async function loadCategoryBudgets() {
      try {
        const budgets = await getBudgetCategories('f4e2af28-f270-4c19-90a8-81e85280b628', dateRange)
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
  }, [dateRange])

  const handleBudgetChange = async () => {
    const newBudget = parseFloat(budgetInput)
    if (isNaN(newBudget) || newBudget <= 0) {
      alert('Please enter a valid budget amount')
      return
    }

    try {
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
    try {
      // Save each category budget
      for (const [category, amount] of Object.entries(categoryBudgets)) {
        if (amount && amount > 0) {
          await upsertBudget({
            user_id: 'f4e2af28-f270-4c19-90a8-81e85280b628',
            category,
            amount,
            month: dateRange
          })
        }
      }
      setIsEditingCategoryBudgets(false)
      // Refresh the budget data
      const total = await getTotalBudget('f4e2af28-f270-4c19-90a8-81e85280b628', dateRange)
      setMonthlyBudget(total)
      setBudgetInput(total.toString())
    } catch (err) {
      console.error('Error saving category budgets:', err)
      alert('Failed to save category budgets')
    }
  }

  const isRevenue = (t: Transaction) => ['income', 'revenue'].includes(t.type.toLowerCase())
  const isExpense = (t: Transaction) => ['expense', 'spending', 'expense'].includes(t.type.toLowerCase())

  const totalExpense = transactions
    .filter(isExpense)
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

  const totalRevenue = transactions
    .filter(isRevenue)
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

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

  const allCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      label: category,
      value: amount,
      change: Math.floor(Math.random() * 20) - 10 // Mock change data
    }))

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
      </div>

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
                          type="text"
                          value={budgetInput ? formatNumberWithSeparators(parseFloat(budgetInput)) : ''}
                          onChange={(e) => {
                            // Remove non-numeric characters except decimal point
                            const value = e.target.value.replace(/[^0-9.]/g, '')
                            setBudgetInput(value)
                          }}
                          className="budget-edit-input-field"
                          min="0"
                          step="100"
                          placeholder="0"
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
                        type="text"
                        value={categoryBudgets[category] ? formatNumberWithSeparators(categoryBudgets[category]) : ''}
                        onChange={(e) => {
                          // Remove non-numeric characters except decimal point
                          const value = e.target.value.replace(/[^0-9.]/g, '')
                          handleCategoryBudgetChange(category, value)
                        }}
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
                  backgroundColor: totalExpense > monthlyBudget ? 'var(--danger)' : 'var(--primary)'
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
