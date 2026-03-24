import React from 'react'

/**
 * Error Boundary component to catch React errors
 */
interface ErrorBoundaryProps {
    children: React.ReactNode
    onReset?: () => void
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('Error caught by boundary:', error, errorInfo)
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null })
        if (this.props.onReset) {
            this.props.onReset()
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary__content">
                        <span className="error-boundary__icon">⚠️</span>
                        <h2 className="error-boundary__title">Something went wrong</h2>
                        <p className="error-boundary__message">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button className="error-boundary__retry" onClick={this.handleRetry}>
                            Try Again
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
