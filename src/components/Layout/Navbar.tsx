import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { useSidebarFilters } from './AppLayout'
import { Button } from '../Shared/Button'
import './Navbar.css'

interface PageTitles {
  [key: string]: string
}

const PAGE_TITLES: PageTitles = {
  '/': 'Dashboard',
  '/expenses': 'Transactions',
  '/audit': 'Audit Reports',
  '/reports': 'Reports',
  '/categories': 'Categories',
}

export function Navbar() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { toggleMobileMenu } = useSidebarFilters()
  const title = PAGE_TITLES[pathname] ?? 'Fallen Ledger'

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="navbar">
      <button
        className="navbar__menu-btn"
        onClick={toggleMobileMenu}
        aria-label="Open menu"
      >
        ☰
      </button>
      <h1 className="navbar__title">{title}</h1>
      <div className="navbar__actions">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
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
