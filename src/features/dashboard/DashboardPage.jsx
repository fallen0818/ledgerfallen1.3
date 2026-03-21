import React, { useState, useEffect } from 'react'
import { useTransactions } from '../../hooks/useTransactions'
import { BudgetProgress } from './BudgetProgress'
import { Card } from '../../components/Shared/Card'
import { StatCardSkeleton } from '../../components/Shared/Skeleton'
import { formatCurrency } from '../../utils/currency'
import { getCurrentMonth } from '../../utils/date'
import { getBudgets } from '../../services/budgetService'
import './DashboardPage.css'

function StatCard({ label, value, sub, accent }) {
  return (
    <Card className={`stat-card ${accent ? 'stat-card--accent' : ''}`}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {sub && <p className="stat-card__sub">{sub}</p>}
    </Card>
  )
}

const DEFAULT_BUDGET = 2000

export function DashboardPage() {
  const month = getCurrentMonth()
  const { transactions, loading: txLoading } = useTransactions(month)
  const [monthlyBudget, setMonthlyBudget] = useState(DEFAULT_BUDGET)
  const [loading, setLoading] = useState(true)

  // Fetch budget from service
  useEffect(() => {
    async function fetchBudget() {
      try {
        const budgets = await getBudgets(month)
        if (budgets && budgets.length > 0) {
          // Sum all category budgets for total monthly budget
          const total = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
          setMonthlyBudget(total)
        }
      } catch (err) {
        console.error('Error fetching budget:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBudget()
  }, [month])

  const isRevenue = (t) => ['income', 'revenue'].includes(t.type.toLowerCase())
  const isExpense = (t) => ['expense', 'spending', 'spent'].includes(t.type.toLowerCase())

  const totalSpent = transactions
    .filter(isExpense)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalRevenue = transactions
    .filter(isRevenue)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const remaining = Math.max(0, monthlyBudget - totalSpent)
  const txCount = transactions.length

  const [y, m] = month.split('-')
  const monthLabel = new Date(y, m - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })

  // Show skeletons while loading
  if (txLoading || loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__stats">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <Card className="dashboard__budget-card">
          <h2 className="dashboard__section-title">Monthly Budget Overview</h2>
          <div className="dashboard-loading">Loading budget data...</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard__stats">
        <StatCard
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          sub={monthLabel}
          accent={totalSpent > monthlyBudget}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          sub={monthLabel}
        />
        <StatCard
          label="Net Balance"
          value={formatCurrency(totalRevenue - totalSpent)}
          sub={monthLabel}
          accent={(totalRevenue - totalSpent) < 0}
        />
        <StatCard
          label="Transactions"
          value={txCount}
          sub="this month"
        />
      </div>

      <Card className="dashboard__budget-card">
        <h2 className="dashboard__section-title">Monthly Budget Overview</h2>
        <BudgetProgress
          spent={totalSpent}
          budget={monthlyBudget}
          month={monthLabel}
        />
        <div className="dashboard__budget-remaining">
          <span>Remaining: </span>
          <strong style={{ color: remaining > 0 ? 'var(--success)' : 'var(--danger)' }}>
            {formatCurrency(remaining)}
          </strong>
        </div>
      </Card>
    </div>
  )
}
