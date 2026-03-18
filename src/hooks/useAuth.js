import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { logout } from '../features/auth/authService'

/**
 * Subscribes to Supabase auth state changes.
 * Returns the current user, loading state, and a signOut helper.
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading, signOut: logout }
}
