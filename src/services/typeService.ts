import { supabase } from '../lib/supabase'

/**
 * Fetch all available transaction types from the 'types' table.
 * Assumes the table has a 'name' column.
 */
export async function getTypes() {
  const { data, error } = await supabase
    .from('types')
    .select('name')
    .order('name', { ascending: true })

  if (error) throw error
  return data.map(t => t.name)
}

/**
 * Fetch all available transaction types with their IDs from the 'types' table.
 * Returns objects with id and name properties for use in dropdowns, so the
 * selected type's id can be stored on the transaction (not just its name).
 */
export async function getTypesWithId() {
  const { data, error } = await supabase
    .from('types')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Create a new type owned by the currently signed-in user.
 * The database auto-generates the id — never pass one in.
 * @param name - the type name (required), e.g. "Investment"
 */
export async function createType(name: string) {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Type name cannot be empty.')
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Not signed in — cannot create a type without a user.')

  const { data, error } = await supabase
    .from('types')
    .insert([{ name: trimmed, user_id: user.id }])
    .select('id, name')
    .single()

  if (error) throw error
  return data
}

/**
 * Rename a type you own.
 */
export async function updateType(id: number, name: string) {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Type name cannot be empty.')
  }

  const { data, error } = await supabase
    .from('types')
    .update({ name: trimmed })
    .eq('id', id)
    .select('id, name')
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a type you own. Will fail if any transaction still references it
 * (the database enforces this via ON DELETE RESTRICT), so re-categorize
 * those transactions first.
 */
export async function deleteType(id: number): Promise<void> {
  const { error } = await supabase.from('types').delete().eq('id', id)
  if (error) throw error
}
