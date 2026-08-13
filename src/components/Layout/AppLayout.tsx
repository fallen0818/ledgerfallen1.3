import { useState, createContext, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import './AppLayout.css'

// Create context for sidebar filters
interface SidebarFiltersContext {
  selectedMonth: number
  selectedYear: number
  setSelectedMonth: (month: number) => void
  setSelectedYear: (year: number) => void
  isMobileMenuOpen: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
}

const SidebarContext = createContext<SidebarFiltersContext>({
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),
  setSelectedMonth: () => { },
  setSelectedYear: () => { },
  isMobileMenuOpen: false,
  toggleMobileMenu: () => { },
  closeMobileMenu: () => { }
})

export const useSidebarFilters = () => useContext(SidebarContext)

export function AppLayout() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const contextValue = {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    isMobileMenuOpen,
    toggleMobileMenu: () => setIsMobileMenuOpen((open) => !open),
    closeMobileMenu: () => setIsMobileMenuOpen(false)
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className="app-layout">
        <Sidebar />
        <div className="app-layout__main">
          <Navbar />
          <main className="app-layout__content">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
