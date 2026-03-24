import { supabase } from '../../lib/supabase'

/**
 * Sign in an existing user with email + password.
 */
export async function login(email: string, password: string): Promise<any> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/**
 * Register a new user with email + password.
 */
export async function signup(email: string, password: string): Promise<any> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

/**
 * Sign out the current user.
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get the currently authenticated user.
 */
export async function getUser(): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
