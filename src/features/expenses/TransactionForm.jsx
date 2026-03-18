import React, { useState, useEffect } from 'react'
import { Button } from '../../components/Shared/Button'
import { useAuth } from '../../hooks/useAuth'
import { getTypes } from '../../services/typeService'
import { getCategories } from '../../services/categoryService'
import './TransactionForm.css'

/**
 * @param {{ onSubmit: (transaction: object) => Promise<void>, onCancel: () => void, initialData?: object }} props
 */
export function TransactionForm({ onSubmit, onCancel, initialData }) {
  const { user } = useAuth()
  const isEditing = !!initialData
  const today = new Date().toISOString().split('T')[0]
  
  const [types, setTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState(null)

  const [form, setForm] = useState({
    amount: initialData?.amount || '',
    category_name: initialData?.category_name || '',
    transaction_date: initialData?.transaction_date || today,
    type: initialData?.type || '',
    description: initialData?.description || '',
    user_email: initialData?.user_email || user?.email || '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load types and categories on mount
  useEffect(() => {
    Promise.all([getTypes(), getCategories()])
      .then(([fetchedTypes, fetchedCategories]) => {
        setTypes(fetchedTypes)
        setCategories(fetchedCategories)
        
        // Only set defaults if not editing
        if (!isEditing) {
          setForm(prev => ({
            ...prev,
            type: fetchedTypes.length > 0 ? fetchedTypes[0] : '',
            category_name: fetchedCategories.length > 0 ? fetchedCategories[0] : '',
          }))
        }
        
        setDataLoading(false)
      })
      .catch(err => {
        console.error('Error loading form data:', err)
        setDataError('Failed to load transaction types or categories.')
        setDataLoading(false)
      })
  }, [isEditing])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.type || !form.category_name) {
      setError('Please select both a type and a category.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await onSubmit({ 
        ...form, 
        amount: parseFloat(form.amount),
        user_email: user?.email // Always use the current user's email
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="tx-form" onSubmit={handleSubmit}>
      {error && <div className="tx-form__error">{error}</div>}
      {dataError && <div className="tx-form__error">{dataError}</div>}

      <div className="tx-form__field">
        <label htmlFor="tx-amount" className="tx-form__label">Amount (₱)</label>
        <input
          id="tx-amount"
          type="number"
          step="0.01"
          min="0.01"
          className="tx-form__input"
          placeholder="0.00"
          value={form.amount}
          onChange={set('amount')}
          required
        />
      </div>

      <div className="tx-form__field">
        <label htmlFor="tx-type" className="tx-form__label">Type</label>
        <select
          id="tx-type"
          className="tx-form__input tx-form__select"
          value={form.type}
          onChange={set('type')}
          disabled={dataLoading}
          required
        >
          {dataLoading ? (
            <option>Loading types...</option>
          ) : (
            types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))
          )}
        </select>
      </div>

      <div className="tx-form__field">
        <label htmlFor="tx-category" className="tx-form__label">Category</label>
        <select
          id="tx-category"
          className="tx-form__input tx-form__select"
          value={form.category_name}
          onChange={set('category_name')}
          disabled={dataLoading}
          required
        >
          {dataLoading ? (
            <option>Loading categories...</option>
          ) : (
            categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))
          )}
        </select>
      </div>

      <div className="tx-form__field">
        <label htmlFor="tx-date" className="tx-form__label">Date</label>
        <input
          id="tx-date"
          type="date"
          className="tx-form__input"
          value={form.transaction_date}
          onChange={set('transaction_date')}
          required
        />
      </div>

      <div className="tx-form__field">
        <label htmlFor="tx-email" className="tx-form__label">User Email</label>
        <input
          id="tx-email"
          type="email"
          className="tx-form__input tx-form__input--readonly"
          value={user?.email || ''}
          readOnly
          disabled
        />
      </div>

      <div className="tx-form__field">
        <label htmlFor="tx-desc" className="tx-form__label">Description</label>
        <input
          id="tx-desc"
          type="text"
          className="tx-form__input"
          placeholder="Optional note…"
          value={form.description}
          onChange={set('description')}
          maxLength={200}
          required
        />
      </div>

      <div className="tx-form__actions">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading || dataLoading}>
          {loading ? 'Saving…' : isEditing ? 'Update Transaction' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  )
}
