import { ProgressBar } from '../../components/Shared/ProgressBar'
import './BudgetProgress.css'
import { formatCurrency } from '../../utils/currency'

/**
 * Monthly budget progress bar component.
 * @param {number} spent — total spent this month
 * @param {number} budget — total budget for this month
 * @param {string} [month] — display label e.g. 'March 2026'
 */
export function BudgetProgress({ spent = 0, budget = 0, month = 'This Month' }) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0
  const remaining = Math.max(0, budget - spent)
  const isOver = spent > budget

  return (
    <div className="budget-progress">
      <div className="budget-progress__header">
        <span className="budget-progress__label">{month} Budget</span>
        <span className={`budget-progress__status ${isOver ? 'budget-progress__status--over' : ''}`}>
          {isOver
            ? `Over by ${formatCurrency(spent - budget)}`
            : `${formatCurrency(remaining)} remaining`}
        </span>
      </div>
      <ProgressBar value={pct} />
      <div className="budget-progress__meta">
        <span>{formatCurrency(spent)} spent</span>
        <span>{formatCurrency(budget)} budget</span>
      </div>
    </div>
  )
}
