import { createClient } from '@supabase/supabase-js'

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string
    readonly VITE_SUPABASE_ANON_KEY?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// TEMPORARY DEBUG LOGGING — remove once the issue is found.
// This does NOT print the actual key, just whether it exists and its length.
console.log('[DEBUG] Supabase URL loaded:', supabaseUrl)
console.log('[DEBUG] Supabase anon key present:', !!supabaseAnonKey)
console.log('[DEBUG] Supabase anon key length:', supabaseAnonKey?.length)
console.log('[DEBUG] Supabase anon key first 10 chars:', supabaseAnonKey?.slice(0, 10))
console.log('[DEBUG] Supabase anon key last 10 chars:', supabaseAnonKey?.slice(-10))

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)