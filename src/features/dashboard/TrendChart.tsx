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
  const maxValue = Math.max(1, ...data.map(d => Math.max(d.expense, d.revenue)))

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
      </div>

      <div className="trend-chart__bars" style={{ height: CHART_HEIGHT }}>
        {data.map((point) => {
          const revenueHeight = (point.revenue / maxValue) * CHART_HEIGHT
          const expenseHeight = (point.expense / maxValue) * CHART_HEIGHT
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
              </div>
              <span className="trend-chart__month-label">{point.monthLabel}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
