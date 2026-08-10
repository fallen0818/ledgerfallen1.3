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