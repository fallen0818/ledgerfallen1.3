import React, { useState, useEffect } from 'react'
import { getTypes } from '../../services/typeService'
import { getCategories } from '../../services/categoryService'
import { Button } from '../../components/Shared/Button'
import { getMonthRange } from '../../utils/date'
import './TransactionFilters.css'

interface FilterState {
  description: string
  startDate: string
  endDate: string
  type: string
  category_name: string
}

interface TransactionFiltersProps {
  onFilter: (filters: FilterState) => void
}

const EMPTY_FILTERS: FilterState = {
  description: '',
  startDate: '',
  endDate: '',
  type: 'All',
  category_name: 'All'
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toLocalDateString(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function TransactionFilters({ onFilter }: TransactionFiltersProps) {
  const [types, setTypes] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getTypes(), getCategories()])
      .then(([t, c]) => {
        setTypes(t)
        setCategories(c)
      })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setActivePreset(null) // manual edits deselect any preset
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFilter(filters)
  }

  const handleReset = () => {
    setFilters(EMPTY_FILTERS)
    setActivePreset(null)
    onFilter(EMPTY_FILTERS)
  }

  const applyPreset = (key: string) => {
    const now = new Date()
    let startDate = ''
    let endDate = ''

    if (key === 'thisMonth') {
      const range = getMonthRange(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`)
      startDate = range.start
      endDate = range.end
    } else if (key === 'lastMonth') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const range = getMonthRange(`${lastMonthDate.getFullYear()}-${pad(lastMonthDate.getMonth() + 1)}`)
      startDate = range.start
      endDate = range.end
    } else if (key === 'thisYear') {
      startDate = `${now.getFullYear()}-01-01`
      endDate = toLocalDateString(now)
    } else if (key === 'lastYear') {
      startDate = `${now.getFullYear() - 1}-01-01`
      endDate = `${now.getFullYear() - 1}-12-31`
    } else if (key === 'allTime') {
      startDate = ''
      endDate = ''
    }

    const next = { ...filters, startDate, endDate }
    setFilters(next)
    setActivePreset(key)
    onFilter(next)
  }

  return (
    <form className="tx-filters" onSubmit={handleSubmit}>
      <div className="tx-filters__presets">
        {[
          { key: 'thisMonth', label: 'This Month' },
          { key: 'lastMonth', label: 'Last Month' },
          { key: 'thisYear', label: 'This Year' },
          { key: 'lastYear', label: 'Last Year' },
          { key: 'allTime', label: 'All Time' },
        ].map(preset => (
          <button
            key={preset.key}
            type="button"
            className={`tx-filters__preset ${activePreset === preset.key ? 'tx-filters__preset--active' : ''}`}
            onClick={() => applyPreset(preset.key)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="tx-filters__grid">
        <div className="tx-filter">
          <label className="tx-filter__label">Search Description</label>
          <input
            type="text"
            name="description"
            value={filters.description}
            onChange={handleChange}
            placeholder="e.g. Overhead Lines..."
            className="tx-filter__input"
          />
        </div>

        <div className="tx-filter">
          <label className="tx-filter__label">Date From</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
            className="tx-filter__input"
          />
        </div>

        <div className="tx-filter">
          <label className="tx-filter__label">Date To</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
            className="tx-filter__input"
          />
        </div>

        <div className="tx-filter">
          <label className="tx-filter__label">Type</label>
          <select name="type" value={filters.type} onChange={handleChange} className="tx-filter__input">
            <option value="All">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="tx-filter">
          <label className="tx-filter__label">Category</label>
          <input
            type="text"
            name="category_name"
            list="tx-filter-category-options"
            value={filters.category_name}
            onChange={handleChange}
            placeholder="All Categories (type to search)"
            className="tx-filter__input"
            autoComplete="off"
          />
          <datalist id="tx-filter-category-options">
            <option value="All" />
            {categories.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>

      <div className="tx-filters__actions">
        <Button type="button" variant="ghost" onClick={handleReset}>Reset</Button>
        <Button type="submit">Apply Filters</Button>
      </div>
    </form>
  )
}
