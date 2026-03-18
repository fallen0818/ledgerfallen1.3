import React from 'react'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/date'
import { Button } from '../../components/Shared/Button'
import './TransactionList.css'

/**
 * Trashcan Icon Component (Inline SVG)
 */
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
)

/**
 * Pencil Icon Component (Inline SVG)
 */
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
)

/**
 * @param {{ transactions: Array, loading: boolean, onDelete: (id: string) => void, onEdit: (tx: object) => void }} props
 */
export function TransactionList({ transactions, loading, onDelete, onEdit }) {
  if (loading) return <p className="tx-list__empty">Loading transactions…</p>
  if (transactions.length === 0) return (
    <p className="tx-list__empty">No transactions found. Add one above!</p>
  )

  return (
    <div className="tx-list">
      <div className="tx-list__header">
        <span>Description</span>
        <span>Category</span>
        <span>Type</span>
        <span>Date</span>
        <span>User Email</span>
        <span>Amount</span>
        <span className="tx-list__actions-head">Actions</span>
      </div>
      {transactions.map((tx) => (
        <div key={tx.id} className="tx-list__row">
          <span className="tx-list__desc" title={tx.description}>{tx.description || '—'}</span>
          <span className="tx-list__badge">{tx.category_name}</span>
          <span className={`tx-list__type tx-list__type--${tx.type.toLowerCase()}`}>
            {tx.type}
          </span>
          <span className="tx-list__date">{formatDate(tx.transaction_date)}</span>
          <span className="tx-list__email" title={tx.user_email}>{tx.user_email || '—'}</span>
          <span className="tx-list__amount">{formatCurrency(tx.amount)}</span>
          <div className="tx-list__actions">
            <Button
              variant="ghost"
              onClick={() => onEdit(tx)}
              aria-label={`Edit ${tx.description}`}
              className="tx-list__action-btn"
            >
              <EditIcon />
            </Button>
            <Button
              variant="danger"
              onClick={() => onDelete(tx.id)}
              aria-label={`Delete ${tx.description}`}
              className="tx-list__action-btn"
            >
              <TrashIcon />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
