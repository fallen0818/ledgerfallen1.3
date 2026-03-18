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
