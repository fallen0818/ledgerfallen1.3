import React from 'react'
import './Button.css'

/**
 * Reusable button component.
 * @param {'primary'|'ghost'|'danger'} [variant='primary']
 */
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary'
  className?: string
  [key: string]: any
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
