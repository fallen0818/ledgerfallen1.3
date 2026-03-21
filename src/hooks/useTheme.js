import { useState, useEffect, useCallback } from 'react'

const THEME_KEY = 'fallen-ledger-theme'

/**
 * Hook for managing theme (dark/light mode)
 */
export function useTheme() {
    const [theme, setThemeState] = useState(() => {
        // Check localStorage first
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(THEME_KEY)
            if (saved === 'light' || saved === 'dark') {
                return saved
            }
            // Check system preference
            if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
                return 'light'
            }
        }
        return 'dark'
    })

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem(THEME_KEY, theme)
    }, [theme])

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = (e) => {
            const saved = localStorage.getItem(THEME_KEY)
            // Only auto-switch if user hasn't set a preference
            if (!saved) {
                setThemeState(e.matches ? 'dark' : 'light')
            }
        }
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    const setTheme = useCallback((newTheme) => {
        setThemeState(newTheme)
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
    }, [])

    return { theme, setTheme, toggleTheme, isDark: theme === 'dark' }
}
