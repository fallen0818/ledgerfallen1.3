import React, { createContext, useContext, useState, useCallback } from 'react'
import './Toast.css'

interface Toast {
    id: number
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
}

interface ToastContextType {
    success: (msg: string, duration?: number) => number
    error: (msg: string, duration?: number) => number
    info: (msg: string, duration?: number) => number
    warning: (msg: string, duration?: number) => number
}

const ToastContext = createContext<ToastContextType | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration: number = 4000): number => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, duration)
        return id
    }, [])

    const removeToast = useCallback((id: number): void => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const toast: ToastContextType = {
        success: (msg: string, duration?: number) => addToast(msg, 'success', duration),
        error: (msg: string, duration?: number) => addToast(msg, 'error', duration),
        info: (msg: string, duration?: number) => addToast(msg, 'info', duration),
        warning: (msg: string, duration?: number) => addToast(msg, 'warning', duration),
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
