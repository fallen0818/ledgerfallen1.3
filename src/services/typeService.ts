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
