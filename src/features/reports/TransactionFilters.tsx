import React, { useState, useEffect } from 'react'
import { getTypes } from '../../services/typeService'
import { getCategories } from '../../services/categoryService'
import { Button } from '../../components/Shared/Button'
import './TransactionFilters.css'

export function TransactionFilters({ onFilter }) {
  const [types, setTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    id: '',
    startDate: '',
    endDate: '',
    type: 'All',
    category_name: 'All'
  })

  useEffect(() => {
    Promise.all([getTypes(), getCategories()])
      .then(([t, c]) => {
        setTypes(t)
        setCategories(c)
      })
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onFilter(filters)
  }

  const handleReset = () => {
    const reset = { id: '', startDate: '', endDate: '', type: 'All', category_name: 'All' }
    setFilters(reset)
    onFilter(reset)
  }

  return (
    <form className="tx-filters" onSubmit={handleSubmit}>
      <div className="tx-filters__grid">
        <div className="tx-filter">
          <label className="tx-filter__label">Search ID</label>
          <input 
            type="text" 
            name="id" 
            value={filters.id} 
            onChange={handleChange} 
            placeholder="UUID..." 
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
          <select name="category_name" value={filters.category_name} onChange={handleChange} className="tx-filter__input">
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="tx-filters__actions">
        <Button type="button" variant="ghost" onClick={handleReset}>Reset</Button>
        <Button type="submit">Apply Filters</Button>
      </div>
    </form>
  )
}
