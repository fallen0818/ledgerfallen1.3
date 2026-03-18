import React from 'react'
import { useTransactions } from '../../hooks/useTransactions'
import { BudgetProgress } from './BudgetProgress'
import { Card } from '../../components/Shared/Card'
import { formatCurrency } from '../../utils/currency'
import { getCurrentMonth } from '../../utils/date'
import './DashboardPage.css'

const MONTHLY_BUDGET = 2000 // TODO: pull from budgetService

function StatCard({ label, value, sub, accent }) {
  return (
    <Card className={`stat-card ${accent ? 'stat-card--accent' : ''}`}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {sub && <p className="stat-card__sub">{sub}</p>}
    </Card>
  )
}

export function DashboardPage() {
  const month = getCurrentMonth()
  const { transactions, loading } = useTransactions(month)

  const isRevenue = (t) => ['income', 'revenue'].includes(t.type.toLowerCase())
  const isExpense = (t) => ['expense', 'spending', 'spent'].includes(t.type.toLowerCase())

  // Filter for expenses only for the budget overview
  const totalSpent = transactions
    .filter(isExpense)
    .reduce((sum, t) => sum + Number(t.amount), 0)
    
  const totalRevenue = transactions
    .filter(isRevenue)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const remaining = Math.max(0, MONTHLY_BUDGET - totalSpent)
  const txCount = transactions.length

  // Format month label as 'March 2026'
  const [y, m] = month.split('-')
  const monthLabel = new Date(y, m - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard…</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard__stats">
        <StatCard
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          sub={monthLabel}
          accent={totalSpent > MONTHLY_BUDGET}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          sub={monthLabel}
        />
        <StatCard
          label="Transactions"
          value={txCount}
          sub={`this month`}
        />
      </div>

      <Card className="dashboard__budget-card">
        <h2 className="dashboard__section-title">Monthly Budget Overview</h2>
        <BudgetProgress
          spent={totalSpent}
          budget={MONTHLY_BUDGET}
          month={monthLabel}
        />
      </Card>
    </div>
  )
}
