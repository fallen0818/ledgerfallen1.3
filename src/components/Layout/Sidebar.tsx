import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { getTransactions } from '../../services/transactionService'
import { formatCurrency } from '../../utils/currency'
import { useSidebarFilters } from './AppLayout'
import './Sidebar.css'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/expenses', label: 'Expenses', icon: '💸' },
  { to: '/audit', label: 'Audit', icon: '📋' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/categories', label: 'Categories', icon: '🏷️' },
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function Sidebar() {
  const [transactionCount, setTransactionCount] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useSidebarFilters()

  useEffect(() => {
    async function fetchTransactionData() {
      try {
        const month = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

        const transactions = await getTransactions(month)
        setTransactionCount(transactions.length)

        const total = transactions.reduce((sum, transaction) => {
          const amount = Number(transaction.amount)
          return sum + (transaction.type === 'income' ? amount : -amount)
        }, 0)
        setTotalAmount(total)
      } catch (err) {
        console.error('Failed to fetch transaction data:', err)
      }
    }
    fetchTransactionData()
  }, [selectedMonth, selectedYear])

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value))
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedYear(parseInt(e.target.value))
  }

  const handleYearSpin = (direction: number) => {
    setSelectedYear(selectedYear + direction)
  }

  const currentMonthLabel = `${MONTHS[selectedMonth]} ${selectedYear}`

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-icon">⚖️</span>
        <span className="sidebar__brand-name">Fallen<br />Ledger</span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <span className="sidebar__link-icon">{icon}</span>
            <span className="sidebar__link-label">{label}</span>
            {to === '/expenses' && transactionCount > 0 && (
              <span className="sidebar__transaction-count">{transactionCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__transactions">
        <div className="sidebar__transactions-header">
          <span className="sidebar__transactions-title">Financial Overview</span>
        </div>

        <div className="sidebar__date-controls">
          <div className="sidebar__month-control">
            <label className="sidebar__control-label">Month</label>
            <select
              className="sidebar__month-select"
              value={selectedMonth}
              onChange={handleMonthChange}
            >
              {MONTHS.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>

          <div className="sidebar__year-control">
            <label className="sidebar__control-label">Year</label>
            <div className="sidebar__year-input-wrapper">
              <input
                type="number"
                className="sidebar__year-input"
                value={selectedYear}
                onChange={handleYearChange}
                min="2020"
                max="2030"
              />
              <div className="sidebar__spin-buttons">
                <button
                  type="button"
                  className="sidebar__spin-btn"
                  onClick={() => handleYearSpin(1)}
                  aria-label="Increase year"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="sidebar__spin-btn"
                  onClick={() => handleYearSpin(-1)}
                  aria-label="Decrease year"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar__current-period">
          <span className="sidebar__period-label">Period:</span>
          <span className="sidebar__period-value">{currentMonthLabel}</span>
        </div>

        <div className="sidebar__transactions-stats">
          <div className="sidebar__stat-item">
            <span className="sidebar__stat-label">Transactions</span>
            <span className="sidebar__stat-value">{transactionCount}</span>
          </div>
          <div className="sidebar__stat-item">
            <span className="sidebar__stat-label">Net Total</span>
            <span className={`sidebar__stat-value ${totalAmount >= 0 ? 'sidebar__stat-value--positive' : 'sidebar__stat-value--negative'}`}>
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      <div className="sidebar__footer">
        <span className="sidebar__footer-text">v1.0.0</span>
      </div>
    </aside>
  )
}
