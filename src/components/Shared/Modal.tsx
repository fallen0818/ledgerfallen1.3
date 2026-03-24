import React, { useEffect } from 'react'
import './Modal.css'

/**
 * Overlay modal component.
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {string} [title]
 * @param {'small'|'medium'|'large'|'xlarge'} [size='medium']
 */
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'small' | 'medium' | 'large' | 'xlarge'
}

export function Modal({ isOpen, onClose, title, children, size = 'medium' }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className={`modal modal--${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          {title && <h2 className="modal__title">{title}</h2>}
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
