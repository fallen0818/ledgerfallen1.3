import { useState } from 'react'
import { formatCurrency } from '../../utils/currency'
import './TrendChart.css'

interface TrendChartDataPoint {
  monthLabel: string
  expense: number
  revenue: number
}

interface TrendChartProps {
  data: TrendChartDataPoint[]
}

const CHART_HEIGHT = 180

export function TrendChart({ data }: TrendChartProps) {
  const [showNet, setShowNet] = useState(false)

  const pointsWithNet = data.map((d) => ({ ...d, net: d.revenue - d.expense }))
  const maxValue = Math.max(
    1,
    ...pointsWithNet.map((d) => Math.max(d.expense, d.revenue, Math.abs(d.net)))
  )

  return (
    <div className="trend-chart">
      <div className="trend-chart__legend">
        <span className="trend-chart__legend-item">
          <span className="trend-chart__swatch trend-chart__swatch--revenue" />
          Revenue
        </span>
        <span className="trend-chart__legend-item">
          <span className="trend-chart__swatch trend-chart__swatch--expense" />
          Expense
        </span>
        <button
          className={`trend-chart__net-toggle ${showNet ? 'trend-chart__net-toggle--active' : ''}`}
          onClick={() => setShowNet((s) => !s)}
        >
          <span className="trend-chart__swatch trend-chart__swatch--net" />
          Net {showNet ? '(shown)' : '(show)'}
        </button>
      </div>

      <div className="trend-chart__bars" style={{ height: CHART_HEIGHT }}>
        {pointsWithNet.map((point) => {
          const revenueHeight = (point.revenue / maxValue) * CHART_HEIGHT
          const expenseHeight = (point.expense / maxValue) * CHART_HEIGHT
          const netHeight = (Math.abs(point.net) / maxValue) * CHART_HEIGHT
          return (
            <div key={point.monthLabel} className="trend-chart__group">
              <div className="trend-chart__bar-pair" style={{ height: CHART_HEIGHT }}>
                <div
                  className="trend-chart__bar trend-chart__bar--revenue"
                  style={{ height: `${revenueHeight}px` }}
                  title={`Revenue: ${formatCurrency(point.revenue)}`}
                />
                <div
                  className="trend-chart__bar trend-chart__bar--expense"
                  style={{ height: `${expenseHeight}px` }}
                  title={`Expense: ${formatCurrency(point.expense)}`}
                />
                {showNet && (
                  <div
                    className={`trend-chart__bar ${point.net >= 0 ? 'trend-chart__bar--net-positive' : 'trend-chart__bar--net-negative'}`}
                    style={{ height: `${netHeight}px` }}
                    title={`Net: ${formatCurrency(point.net)}`}
                  />
                )}
              </div>
              <span className="trend-chart__month-label">{point.monthLabel}</span>
              {showNet && (
                <span className={`trend-chart__net-label ${point.net >= 0 ? 'trend-chart__net-label--positive' : 'trend-chart__net-label--negative'}`}>
                  {point.net >= 0 ? '+' : ''}{formatCurrency(point.net)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
