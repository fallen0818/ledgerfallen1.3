import React from 'react'
import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const NAV_ITEMS = [
  { to: '/',         label: 'Dashboard', icon: '📊' },
  { to: '/expenses', label: 'Expenses',  icon: '💸' },
  { to: '/audit',    label: 'Audit',     icon: '📋' },
  { to: '/reports',  label: 'Reports',   icon: '📈' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-icon">⚖️</span>
        <span className="sidebar__brand-name">Fallen<br/>Ledger</span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <span className="sidebar__link-icon">{icon}</span>
            <span className="sidebar__link-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span className="sidebar__footer-text">v1.0.0</span>
      </div>
    </aside>
  )
}
