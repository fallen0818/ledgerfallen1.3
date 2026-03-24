import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Layout
import { AppLayout } from './components/Layout/AppLayout'

// Auth
import { LoginPage } from './features/auth/LoginPage'
import { SignupPage } from './features/auth/SignupPage'

// Pages
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ExpensesPage } from './features/expenses/ExpensesPage'
import { AuditPage } from './features/audit/AuditPage'
import { ReportsPage } from './features/reports/ReportsPage'

// Auth guard
import { useAuth } from './hooks/useAuth'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected app shell */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index          element={<DashboardPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="audit"    element={<AuditPage />} />
        <Route path="reports"  element={<ReportsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
