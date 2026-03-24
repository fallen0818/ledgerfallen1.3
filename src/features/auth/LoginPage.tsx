import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from './authService'
import { Button } from '../../components/Shared/Button'
import './AuthPage.css'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-card__brand-icon">⚖️</span>
          <h1 className="auth-card__title">Fallen Ledger</h1>
        </div>
        <p className="auth-card__subtitle">Welcome back — sign in to your account</p>

        {error && <div className="auth-card__error">{error}</div>}

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email" className="auth-label">Email</label>
            <input
              id="login-email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password" className="auth-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" disabled={loading} className="auth-submit">
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p className="auth-card__footer">
          No account?{' '}
          <Link to="/signup" className="auth-link">Create one →</Link>
        </p>
      </div>
    </div>
  )
}
