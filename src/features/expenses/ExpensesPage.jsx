import React, { useState } from 'react'
import { useTransactions } from '../../hooks/useTransactions'
import { TransactionForm } from './TransactionForm'
import { TransactionList } from './TransactionList'
import { Modal } from '../../components/Shared/Modal'
import { Button } from '../../components/Shared/Button'
import { getCurrentMonth } from '../../utils/date'
import './ExpensesPage.css'

export function ExpensesPage() {
  const month = getCurrentMonth()
  const { transactions, loading, addTransaction, editTransaction, removeTransaction } = useTransactions(month)
  const [showForm, setShowForm] = useState(false)
  const [editingTx, setEditingTx] = useState(null)

  const handleAdd = async (transactionData) => {
    await addTransaction(transactionData)
    closeModal()
  }

  const handleEdit = async (transactionData) => {
    if (editingTx) {
      await editTransaction(editingTx.id, transactionData)
    }
    closeModal()
  }

  const openAdd = () => {
    setEditingTx(null)
    setShowForm(true)
  }

  const openEdit = (tx) => {
    setEditingTx(tx)
    setShowForm(true)
  }

  const closeModal = () => {
    setShowForm(false)
    setEditingTx(null)
  }

  return (
    <div className="expenses-page">
      <div className="expenses-page__header">
        <h2 className="expenses-page__title">Transactions</h2>
        <Button onClick={openAdd}>+ Add Transaction</Button>
      </div>

      <TransactionList
        transactions={transactions}
        loading={loading}
        onDelete={removeTransaction}
        onEdit={openEdit}
      />

      <Modal 
        isOpen={showForm} 
        onClose={closeModal} 
        title={editingTx ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm 
          onSubmit={editingTx ? handleEdit : handleAdd} 
          onCancel={closeModal} 
          initialData={editingTx}
        />
      </Modal>
    </div>
  )
}
