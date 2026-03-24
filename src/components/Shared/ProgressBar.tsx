import './ProgressBar.css'

/**
 * Animated horizontal progress bar.
 * @param {number} value — 0 to 100
 * @param {string} [color] — CSS color string; defaults to --accent
 * @param {string} [label]
 */
interface ProgressBarProps {
  value?: number
  color?: string
  label?: string
}

export function ProgressBar({ value = 0, color, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const isOverBudget = clamped >= 100

  return (
    <div className="progress-bar" aria-label={label}>
      <div
        className={`progress-bar__fill ${isOverBudget ? 'progress-bar__fill--over' : ''}`}
        style={{
          width: `${clamped}%`,
          ...(color && !isOverBudget ? { background: color } : {}),
        }}
      />
    </div>
  )
}
