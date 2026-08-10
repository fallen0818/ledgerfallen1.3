import { supabase } from "../lib/supabase";
import { getCurrentMonth, getMonthRange } from "../utils/date";

interface Transaction {
  id: string;
  amount: number | string;
  category_name: string;
  category_id?: string | null;
  transaction_date: string;
  type: string;
  type_id?: number | null;
  description: string;
  user_email: string;
  user_id?: string;
}

interface FilterParams {
  description?: string;
  startDate?: string;
  endDate?: string;
  category_name?: string;
  type?: string;
}

// Supabase/PostgREST caps any single request at this many rows by default
// (project setting: Settings > API > Max Rows, commonly 1000). Rather than
// depend on that setting being raised, every "give me everything matching
// X" fetch below pages through in batches until it truly has all rows —
// so results stay correct even as the table grows past whatever the cap is.
const PAGE_SIZE = 1000;

async function fetchAllPages<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
): Promise<T[]> {
  const results: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;

    results.push(...data);

    if (data.length < PAGE_SIZE) break; // last page reached
    from += PAGE_SIZE;
  }

  return results;
}

/**
 * Fetch all transactions for the current user in a given month or year.
 * @param {string} [dateRange] — 'YYYY-MM' for month or 'YYYY' for year, defaults to current month
 */
export async function getTransactions(dateRange = getCurrentMonth()) {
  let start: string, end: string;

  // Check if the dateRange is a year (YYYY format) or month (YYYY-MM format)
  if (dateRange.length === 4) {
    // Year format: YYYY
    start = `${dateRange}-01-01`;
    end = `${dateRange}-12-31`;
  } else {
    // Month format: YYYY-MM
    const { start: monthStart, end: monthEnd } = getMonthRange(dateRange);
    start = monthStart;
    end = monthEnd;
  }

  return fetchAllPages((from, to) =>
    supabase
      .from("transactions")
      .select("*")
      .gte("transaction_date", start)
      .lte("transaction_date", end)
      .order("transaction_date", { ascending: false })
      .range(from, to),
  );
}

export async function getFilteredTransactions(filters: FilterParams = {}) {
  return fetchAllPages((from, to) => {
    let query = supabase.from("transactions").select("*");

    if (filters.description) {
      query = query.ilike("description", `%${filters.description}%`);
    }
    if (filters.startDate) {
      query = query.gte("transaction_date", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("transaction_date", filters.endDate);
    }
    if (filters.category_name && filters.category_name !== "All") {
      query = query.eq("category_name", filters.category_name);
    }
    if (filters.type && filters.type !== "All") {
      query = query.eq("type", filters.type);
    }

    return query.order("transaction_date", { ascending: false }).range(from, to);
  });
}

/**
 * Fetch ALL transactions for the current user (no date filter).
 */
export async function getAllTransactions() {
  return fetchAllPages((from, to) =>
    supabase
      .from("transactions")
      .select("*")
      .order("transaction_date", { ascending: false })
      .range(from, to),
  );
}

export async function createTransaction(
  transaction: Omit<Transaction, "id">,
): Promise<Transaction> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Not signed in — cannot create a transaction without a user.");

  // Always use the current session's user id, never trust a caller-supplied
  // one — RLS's with_check (auth.uid() = user_id) rejects any mismatch anyway,
  // but setting it explicitly here gives a clear error instead of a vague
  // RLS failure if this is ever called before a session exists.
  const { data, error } = await supabase
    .from("transactions")
    .insert([{ ...transaction, user_id: user.id }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
