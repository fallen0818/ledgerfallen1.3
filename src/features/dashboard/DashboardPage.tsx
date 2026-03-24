import { useState, useEffect } from 'react'
import { useTransactions } from '../../hooks/useTransactions'
import { Card } from '../../components/Shared/Card'
import { StatCardSkeleton } from '../../components/Shared/Skeleton'
import { formatCurrency } from '../../utils/currency'
import { getCurrentMonth, getYearRange } from '../../utils/date'
import { getTotalBudget } from '../../services/budgetService'
import './DashboardPage.css'

interface Transaction {
  type: string
  amount: string
  category_name?: string
  description?: string
  transaction_date?: string
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

  // Determine the date range based on timeframe
  const dateRange = timeframe === 'monthly' ? selectedMonth : `${selectedYear}-01`

  const { transactions, loading: txLoading } = useTransactions(dateRange)
  const [monthlyBudget, setMonthlyBudget] = useState(DEFAULT_BUDGET)
  const [loading, setLoading] = useState(true)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState(DEFAULT_BUDGET.toString())

  // Fetch budget and categories from services
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch total budget
        const total = await getTotalBudget('default-user', dateRange)

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

  const isRevenue = (t: Transaction) => ['income', 'revenue'].includes(t.type.toLowerCase())
  const isExpense = (t: Transaction) => ['expense', 'spending', 'spent'].includes(t.type.toLowerCase())

  const totalSpent = transactions
    .filter(isExpense)
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

  const totalRevenue = transactions
    .filter(isRevenue)
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

  const remaining = Math.max(0, monthlyBudget - totalSpent)
  const txCount = transactions.length

  // Calculate category breakdown
  const categoryBreakdown = transactions
    .filter(isExpense)
    .reduce((acc, tx: Transaction) => {
      const category = tx.category_name || 'Uncategorized'
      acc[category] = (acc[category] || 0) + Number(tx.amount)
      return acc
    }, {} as Record<string, number>)

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
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
              <button
                className="dashboard__year-btn"
                onClick={() => setSelectedYear(selectedYear - 1)}
                aria-label="Previous year"
              >
                ◀
              </button>
              <span className="dashboard__year-display">{selectedYear}</span>
              <button
                className="dashboard__year-btn"
                onClick={() => setSelectedYear(selectedYear + 1)}
                aria-label="Next year"
              >
                ▶
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard__stats">
        <StatCard
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          sub={displayLabel}
          accent={totalSpent > monthlyBudget}
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
          value={formatCurrency(totalRevenue - totalSpent)}
          sub={displayLabel}
          accent={(totalRevenue - totalSpent) < 0}
          icon={(totalRevenue - totalSpent) >= 0 ? "📈" : "📉"}
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
                          type="number"
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
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
                <span className="budget-value__label">Amount Spent</span>
                <span className="budget-value__amount">{formatCurrency(totalSpent)}</span>
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
          <div className="budget-progress">
            <div className="budget-progress__bar">
              <div
                className="budget-progress__fill"
                style={{
                  width: `${Math.min((totalSpent / monthlyBudget) * 100, 100)}%`,
                  backgroundColor: totalSpent > monthlyBudget ? 'var(--danger)' : 'var(--primary)'
                }}
              ></div>
            </div>
            <div className="budget-progress__labels">
              <span>Budget</span>
              <span>{Math.min(Math.round((totalSpent / monthlyBudget) * 100), 100)}%</span>
            </div>
          </div>
        </Card>

        <TrendCard
          title={timeframe === 'monthly' ? "Top Expense Categories" : "Top Categories This Year"}
          data={topCategories}
        />

        <Card className="dashboard__summary-card">
          <h3 className="dashboard__section-title">Financial Summary</h3>
          <div className="summary-metrics">
            <div className="summary-metric">
              <span className="summary-metric__label">Savings Rate</span>
              <span className="summary-metric__value">
                {totalRevenue > 0 ? Math.round(((totalRevenue - totalSpent) / totalRevenue) * 100).toString() : '0'}%
              </span>
            </div>
            <div className="summary-metric">
              <span className="summary-metric__label">Average Transaction</span>
              <span className="summary-metric__value">
                {txCount > 0 ? formatCurrency((totalRevenue + totalSpent) / txCount) : formatCurrency(0)}
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
