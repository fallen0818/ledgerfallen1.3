import React from 'react'
import { formatCurrency } from '../../utils/currency'
import './VarianceReport.css'

interface Transaction {
  category_name: string
  type: string
  amount: string
}

interface Budget {
  category: string
  amount: string
}

interface VarianceReportProps {
  transactions: Transaction[]
  budgets: Budget[]
}

export function VarianceReport({ transactions, budgets }: VarianceReportProps) {
  const isExpense = (t: Transaction) => ['expense', 'spending', 'spent'].includes(t.type.toLowerCase())

  // Group only expenses by category (ignore income/revenue for the variance report)
  const spentByCategory: Record<string, number> = transactions
    .filter(isExpense)
    .reduce((acc, t) => {
      acc[t.category_name] = (acc[t.category_name] || 0) + Number(t.amount)
      return acc
    }, {})

  // Collect all categories (from both budgets and expenses)
  const allCategories = [
    ...new Set([
      ...budgets.map((b) => b.category),
      ...Object.keys(spentByCategory),
    ]),
  ].sort()

  if (allCategories.length === 0) {
    return <p className="variance-empty">No data for this month.</p>
  }

  return (
    <div className="variance-table">
      <div className="variance-table__header">
        <span>Category</span>
        <span>Budgeted</span>
        <span>Actual</span>
        <span>Variance</span>
        <span>Status</span>
      </div>
      {allCategories.map((cat) => {
        const budgeted = Number(budgets.find((b) => b.category === cat)?.amount ?? 0)
        const actual = spentByCategory[cat] ?? 0
        const variance = budgeted - actual
        const isOver = variance < 0
        const isUnder = variance > 0

        return (
          <div
            key={cat}
            className={`variance-table__row ${isOver ? 'variance-table__row--over' : ''} ${isUnder ? 'variance-table__row--under' : ''}`}
          >
            <span className="variance-table__cat">{cat}</span>
            <span>{formatCurrency(budgeted)}</span>
            <span>{formatCurrency(actual)}</span>
            <span className={isOver ? 'variance--over' : isUnder ? 'variance--under' : ''}>
              {isOver ? '−' : '+'}{formatCurrency(Math.abs(variance))}
            </span>
            <span className={`variance-badge ${isOver ? 'variance-badge--over' : isUnder ? 'variance-badge--under' : 'variance-badge--ok'}`}>
              {isOver ? 'Over' : isUnder ? 'Under' : 'On Track'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
