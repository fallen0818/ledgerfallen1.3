import { supabase } from '../lib/supabase'

/**
 * Fetch all available transaction categories from the 'categories' table.
 * Assumes the table has a 'name' column.
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('name', { ascending: true })

  if (error) throw error
  return data.map(c => c.name)
}

/**
 * Fetch all available transaction categories with their IDs from the 'categories' table.
 * Returns objects with id and name properties for use in dropdowns.
 */
export async function getCategoriesWithId() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Create a new category owned by the currently signed-in user.
 * @param name - the category name (required)
 * @param icon - optional icon identifier/emoji
 * @param color - optional display color (e.g. a hex string)
 */
export async function createCategory(
  name: string,
  icon?: string,
  color?: string,
) {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Category name cannot be empty.')
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Not signed in — cannot create a category without a user.')

  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: trimmed, icon: icon ?? null, color: color ?? null, user_id: user.id }])
    .select('id, name, icon, color')
    .single()

  if (error) throw error
  return data
}

/**
 * Rename an existing category you own.
 */
export async function updateCategory(id: string, updates: { name?: string; icon?: string; color?: string }) {
  const payload: Record<string, unknown> = {}
  if (updates.name !== undefined) payload.name = updates.name.trim()
  if (updates.icon !== undefined) payload.icon = updates.icon
  if (updates.color !== undefined) payload.color = updates.color

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select('id, name, icon, color')
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a category you own. Will fail if any transaction or budget still
 * references it (the database enforces this — see the ON DELETE RESTRICT
 * foreign keys), so remove or re-categorize those first.
 */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
