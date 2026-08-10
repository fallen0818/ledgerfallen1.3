import React, { useState, useEffect } from 'react'
import { Card } from '../../components/Shared/Card'
import { Button } from '../../components/Shared/Button'
import { useToast } from '../../components/Shared/Toast'
import {
  getCategoriesWithId,
  createCategory,
  deleteCategory,
} from '../../services/categoryService'
import {
  getTypesWithId,
  createType,
  deleteType,
} from '../../services/typeService'
import './ManageCategoriesPage.css'

interface NamedRow {
  id: string | number
  name: string
}

export function ManageCategoriesPage() {
  const toast = useToast()

  const [categories, setCategories] = useState<NamedRow[]>([])
  const [types, setTypes] = useState<NamedRow[]>([])
  const [loading, setLoading] = useState(true)

  const [newCategory, setNewCategory] = useState('')
  const [newType, setNewType] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)
  const [savingType, setSavingType] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [cats, tys] = await Promise.all([getCategoriesWithId(), getTypesWithId()])
      setCategories(cats)
      setTypes(tys)
    } catch (err: unknown) {
      toast.error('Failed to load categories/types: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    setSavingCategory(true)
    try {
      await createCategory(newCategory.trim())
      toast.success(`Category "${newCategory.trim()}" added.`)
      setNewCategory('')
      await loadAll()
    } catch (err: unknown) {
      toast.error('Failed to add category: ' + (err as Error).message)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newType.trim()) return
    setSavingType(true)
    try {
      await createType(newType.trim())
      toast.success(`Type "${newType.trim()}" added.`)
      setNewType('')
      await loadAll()
    } catch (err: unknown) {
      toast.error('Failed to add type: ' + (err as Error).message)
    } finally {
      setSavingType(false)
    }
  }

  const handleDeleteCategory = async (id: string | number, name: string) => {
    if (!window.confirm(`Delete category "${name}"? This only works if no transactions or budgets use it.`)) return
    try {
      await deleteCategory(String(id))
      toast.success(`Category "${name}" deleted.`)
      await loadAll()
    } catch (err: unknown) {
      toast.error('Could not delete — it may still be in use by transactions or budgets.')
    }
  }

  const handleDeleteType = async (id: string | number, name: string) => {
    if (!window.confirm(`Delete type "${name}"? This only works if no transactions use it.`)) return
    try {
      await deleteType(Number(id))
      toast.success(`Type "${name}" deleted.`)
      await loadAll()
    } catch (err: unknown) {
      toast.error('Could not delete — it may still be in use by transactions.')
    }
  }

  return (
    <div className="manage-page">
      <div className="manage-page__header">
        <h2 className="manage-page__title">Manage Categories &amp; Types</h2>
        <p className="manage-page__subtitle">Add new categories and types, or remove ones you no longer need.</p>
      </div>

      <div className="manage-page__grid">
        <Card className="manage-page__section">
          <h3 className="manage-page__section-title">Categories</h3>

          <form className="manage-page__add-form" onSubmit={handleAddCategory}>
            <input
              type="text"
              className="manage-page__input"
              placeholder="New category name…"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              maxLength={100}
            />
            <Button type="submit" disabled={savingCategory || !newCategory.trim()}>
              {savingCategory ? 'Adding…' : '+ Add'}
            </Button>
          </form>

          {loading ? (
            <p className="manage-page__loading">Loading…</p>
          ) : (
            <ul className="manage-page__list">
              {categories.length === 0 && (
                <li className="manage-page__empty">No categories yet.</li>
              )}
              {categories.map((c) => (
                <li key={c.id} className="manage-page__list-item">
                  <span>{c.name}</span>
                  <button
                    type="button"
                    className="manage-page__delete-btn"
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    aria-label={`Delete ${c.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="manage-page__section">
          <h3 className="manage-page__section-title">Types</h3>

          <form className="manage-page__add-form" onSubmit={handleAddType}>
            <input
              type="text"
              className="manage-page__input"
              placeholder="New type name…"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              maxLength={100}
            />
            <Button type="submit" disabled={savingType || !newType.trim()}>
              {savingType ? 'Adding…' : '+ Add'}
            </Button>
          </form>

          {loading ? (
            <p className="manage-page__loading">Loading…</p>
          ) : (
            <ul className="manage-page__list">
              {types.length === 0 && (
                <li className="manage-page__empty">No types yet.</li>
              )}
              {types.map((t) => (
                <li key={t.id} className="manage-page__list-item">
                  <span>{t.name}</span>
                  <button
                    type="button"
                    className="manage-page__delete-btn"
                    onClick={() => handleDeleteType(t.id, t.name)}
                    aria-label={`Delete ${t.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
