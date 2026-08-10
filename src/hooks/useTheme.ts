import { useState, useEffect, useCallback } from 'react'

const THEME_KEY = 'fallen-ledger-theme'

/**
 * Hook for managing theme (dark/light mode)
 */
export function useTheme() {
    const [theme, setThemeState] = useState(() => {
        // Respect a saved choice; otherwise the app always opens light,
        // regardless of OS preference. Dark is opt-in via the toggle.
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(THEME_KEY)
            if (saved === 'light' || saved === 'dark') {
                return saved
            }
        }
        return 'light'
    })

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem(THEME_KEY, theme)
    }, [theme])

    const setTheme = useCallback((newTheme: 'light' | 'dark') => {
        setThemeState(newTheme)
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
    }, [])

    return { theme, setTheme, toggleTheme, isDark: theme === 'dark' }
}
