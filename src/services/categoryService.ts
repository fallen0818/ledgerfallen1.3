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
