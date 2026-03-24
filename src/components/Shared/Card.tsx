import React from 'react'
import './Card.css'

/**
 * Glass-effect container card.
 */
interface CardProps {
  children: React.ReactNode
  className?: string
  [key: string]: any
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  )
}
