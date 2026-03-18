import React from 'react'
import './Button.css'

/**
 * Reusable button component.
 * @param {'primary'|'ghost'|'danger'} [variant='primary']
 */
export function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`btn btn--${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
