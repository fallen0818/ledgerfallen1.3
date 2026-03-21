import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import './ConfirmDialog.css'

/**
 * @param {{ 
 *   isOpen: boolean, 
 *   onClose: () => void, 
 *   onConfirm: () => void,
 *   title: string,
 *   message: string,
 *   confirmText?: string,
 *   cancelText?: string,
 *   variant?: 'danger' | 'warning',
 *   loading?: boolean
 * }} props
 */
export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="confirm-dialog">
                <p className="confirm-dialog__message">{message}</p>
                <div className="confirm-dialog__actions">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
