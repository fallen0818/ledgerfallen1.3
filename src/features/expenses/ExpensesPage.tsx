import React, { useState } from 'react'
import { useTransactions } from '../../hooks/useTransactions'
import { TransactionForm } from './TransactionForm'
import { TransactionList } from './TransactionList'
import { Modal } from '../../components/Shared/Modal'
import { Button } from '../../components/Shared/Button'
import { ImportModal } from '../../components/Shared/ImportModal'
import { useToast } from '../../components/Shared/Toast'
import { getCurrentMonth } from '../../utils/date'
import { useAuth } from '../../hooks/useAuth'
import { exportTransactionsToCSV } from '../../utils/exportUtils'
import { useSidebarFilters } from '../../components/Layout/AppLayout'
import './ExpensesPage.css'

export function ExpensesPage() {
  const { selectedMonth, selectedYear } = useSidebarFilters()
  const month = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
  console.log('ExpensesPage - selected month/year:', { selectedMonth, selectedYear, month })

  const { transactions, loading, addTransaction, editTransaction, removeTransaction } = useTransactions(month)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const toast = useToast()
  const { user } = useAuth()

  const handleAdd = async (transactionData) => {
    try {
      await addTransaction(transactionData)
      toast.success('Transaction added successfully!')
      closeModal()
    } catch (err) {
      toast.error('Failed to add transaction: ' + err.message)
    }
  }

  const handleEdit = async (transactionData) => {
    if (editingTx) {
      try {
        await editTransaction(editingTx.id, transactionData)
        toast.success('Transaction updated successfully!')
        closeModal()
      } catch (err) {
        toast.error('Failed to update transaction: ' + err.message)
      }
    }
  }

  const handleImport = async (importedTransactions) => {
    let successCount = 0
    let errorCount = 0

    for (const tx of importedTransactions) {
      try {
        await addTransaction({
          ...tx,
          user_email: user?.email
        })
        successCount++
      } catch (err) {
        errorCount++
        console.error('Failed to import transaction:', err)
      }
    }

    if (errorCount > 0) {
      toast.warning(`Imported ${successCount} transactions. ${errorCount} failed.`)
    } else {
      toast.success(`Successfully imported ${successCount} transactions!`)
    }

    setShowImport(false)
  }

  const handleExport = () => {
    if (transactions.length === 0) {
      toast.warning('No transactions to export')
      return
    }
    exportTransactionsToCSV(transactions, 'transactions')
    toast.success('Transactions exported successfully!')
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
        <div className="expenses-page__actions">
          <Button variant="secondary" onClick={handleExport} disabled={transactions.length === 0}>
            Export
          </Button>
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            Import
          </Button>
          <Button onClick={openAdd}>+ Add Transaction</Button>
        </div>
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

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </div>
  )
}
