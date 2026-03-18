import React from 'react'
import { Card } from '../../components/Shared/Card'
import { formatCurrency } from '../../utils/currency'
import './RevenueExpenseReport.css'

export function RevenueExpenseReport({ transactions }) {
  const isRevenue = (t) => ['income', 'revenue'].includes(t.type.toLowerCase())
  const isExpense = (t) => ['expense', 'spending', 'spent'].includes(t.type.toLowerCase())

  const revenue = transactions
    .filter(isRevenue)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expenses = transactions
    .filter(isExpense)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const net = revenue - expenses
  const isProfit = net >= 0

  return (
    <div className="re-report">
      <div className="re-report__summary">
        <Card className="re-card re-card--revenue">
          <span className="re-card__label">Total Revenue</span>
          <span className="re-card__value">{formatCurrency(revenue)}</span>
        </Card>
        <Card className="re-card re-card--expenses">
          <span className="re-card__label">Total Expenses</span>
          <span className="re-card__value">{formatCurrency(expenses)}</span>
        </Card>
        <Card className={`re-card re-card--net ${isProfit ? 're-card--profit' : 're-card--loss'}`}>
          <span className="re-card__label">Net {isProfit ? 'Income' : 'Loss'}</span>
          <span className="re-card__value">{isProfit ? '+' : ''}{formatCurrency(net)}</span>
        </Card>
      </div>

      {transactions.length > 0 && (
        <Card className="re-report__breakdown">
          <h3 className="re-report__title">Filtered Results ({transactions.length})</h3>
          <div className="re-report__table-wrap">
            <table className="re-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 50).map(tx => (
                  <tr key={tx.id} className={`re-row--${tx.type.toLowerCase()}`}>
                    <td>{tx.transaction_date}</td>
                    <td>{tx.description}</td>
                    <td><span className="re-tag">{tx.category_name}</span></td>
                    <td>{tx.type}</td>
                    <td className="re-amount">{formatCurrency(tx.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length > 50 && (
              <p className="re-report__more">Showing first 50 results...</p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
