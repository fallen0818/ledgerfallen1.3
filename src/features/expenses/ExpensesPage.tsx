import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTransactions } from '../../hooks/useTransactions'
import { TransactionForm } from './TransactionForm'
import { TransactionList } from './TransactionList'
import { Modal } from '../../components/Shared/Modal'
import { Button } from '../../components/Shared/Button'
import { ImportModal } from '../../components/Shared/ImportModal'
import { useToast } from '../../components/Shared/Toast'
import { useAuth } from '../../hooks/useAuth'
import { exportTransactionsToCSV } from '../../utils/exportUtils'
import { useSidebarFilters } from '../../components/Layout/AppLayout'
import './ExpensesPage.css'

interface Transaction {
  id: string
  type: string
  amount: string
  category_name?: string
  description?: string
  transaction_date?: string
}

export function ExpensesPage() {
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const { selectedMonth, selectedYear } = useSidebarFilters()
  const month = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

  const { transactions, loading, addTransaction, editTransaction, removeTransaction } = useTransactions(month)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const toast = useToast()
  const { user } = useAuth()

  const handleAdd = async (transactionData: any) => {
    try {
      await addTransaction(transactionData)
      toast.success('Transaction added successfully!')
      closeModal()
    } catch (err: unknown) {
      toast.error('Failed to add transaction: ' + (err as Error).message)
    }
  }

  const handleEdit = async (transactionData: any) => {
    if (editingTx) {
      try {
        await editTransaction(editingTx.id, transactionData)
        toast.success('Transaction updated successfully!')
        closeModal()
      } catch (err: unknown) {
        toast.error('Failed to update transaction: ' + (err as Error).message)
      }
    }
  }

  const handleImport = async (importedTransactions: any[]) => {
    let successCount = 0
    let errorCount = 0
    let firstError: string | null = null

    for (const tx of importedTransactions) {
      try {
        // rowIndex/errors are ImportModal's own preview-table bookkeeping,
        // not real transaction columns — never send them to the database.
        const { rowIndex, errors: _rowErrors, ...cleanTx } = tx
        await addTransaction({
          ...cleanTx,
          user_email: user?.email
        })
        successCount++
      } catch (err: unknown) {
        errorCount++
        const message = (err as Error).message
        if (!firstError) firstError = message
        console.error('Failed to import transaction:', err)
      }
    }

    if (errorCount > 0) {
      toast.warning(`Imported ${successCount} transactions. ${errorCount} failed.`)
    } else {
      toast.success(`Successfully imported ${successCount} transactions!`)
    }

    // Let ImportModal know what actually happened, instead of it assuming
    // success just because this function didn't throw.
    return { successCount, errorCount, firstError }
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

  const openEdit = (tx: Transaction) => {
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
        initialSearch={initialSearch}
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
