import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import './AppLayout.css'

export function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout__main">
        <Navbar />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
