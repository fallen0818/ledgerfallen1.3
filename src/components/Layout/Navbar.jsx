import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../Shared/Button'
import './Navbar.css'

const PAGE_TITLES = {
  '/':         'Dashboard',
  '/expenses': 'Expenses',
  '/audit':    'Audit Reports',
}

export function Navbar() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const title = PAGE_TITLES[pathname] ?? 'Fallen Ledger'

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="navbar">
      <h1 className="navbar__title">{title}</h1>
      <div className="navbar__actions">
        {user && (
          <>
            <div className="navbar__avatar" title={user.email}>{initials}</div>
            <Button variant="ghost" onClick={signOut}>Sign Out</Button>
          </>
        )}
      </div>
    </header>
  )
}
