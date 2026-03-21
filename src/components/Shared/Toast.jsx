import React, { createContext, useContext, useState, useCallback } from 'react'
import './Toast.css'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, duration)
        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const toast = {
        success: (msg, duration) => addToast(msg, 'success', duration),
        error: (msg, duration) => addToast(msg, 'error', duration),
        info: (msg, duration) => addToast(msg, 'info', duration),
        warning: (msg, duration) => addToast(msg, 'warning', duration),
    }

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast--${t.type}`}>
                        <span className="toast__icon">
                            {t.type === 'success' && '✓'}
                            {t.type === 'error' && '✕'}
                            {t.type === 'info' && 'ℹ'}
                            {t.type === 'warning' && '⚠'}
                        </span>
                        <span className="toast__message">{t.message}</span>
                        <button className="toast__close" onClick={() => removeToast(t.id)}>✕</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

// Export a no-op toast for when used outside provider
const noopToast = {
    success: () => { },
    error: () => { },
    info: () => { },
    warning: () => { }
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        return noopToast
    }
    return context
}
