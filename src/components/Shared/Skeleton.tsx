import React from 'react'
import './Skeleton.css'

/**
 * Loading skeleton component
 * @param {{ width?: string, height?: string, borderRadius?: string, className?: string }} props
 */
interface SkeletonProps {
    width?: string
    height?: string
    borderRadius?: string
    className?: string
}

export function Skeleton({ width = '100%', height = '20px', borderRadius = '6px', className = '' }: SkeletonProps) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ width, height, borderRadius }}
        />
    )
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton() {
    return (
        <div className="card-skeleton">
            <div className="card-skeleton__header">
                <Skeleton width="40%" height="24px" />
                <Skeleton width="80px" height="32px" />
            </div>
            <div className="card-skeleton__body">
                <Skeleton width="100%" height="16px" />
                <Skeleton width="85%" height="16px" />
                <Skeleton width="70%" height="16px" />
            </div>
        </div>
    )
}

/**
 * Table row skeleton - uses stable widths instead of random
 */
export function TableRowSkeleton({ columns = 6 }) {
    // Use stable widths instead of Math.random
    const widths = ['80%', '60%', '70%', '50%', '75%', '65%']
    return (
        <div className="table-row-skeleton">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} width={widths[i % widths.length]} height="16px" />
            ))}
        </div>
    )
}

/**
 * Stat card skeleton
 */
export function StatCardSkeleton() {
    return (
        <div className="stat-card-skeleton">
            <Skeleton width="50%" height="14px" />
            <Skeleton width="70%" height="28px" />
            <Skeleton width="40%" height="12px" />
        </div>
    )
}
