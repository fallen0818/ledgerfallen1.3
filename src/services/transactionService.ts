import { supabase } from "../lib/supabase";
import { getCurrentMonth, getMonthRange } from "../utils/date";

interface Transaction {
  id: string;
  amount: number | string;
  category_name: string;
  transaction_date: string;
  type: string;
  description: string;
  user_email: string;
}

interface FilterParams {
  id?: string;
  startDate?: string;
  endDate?: string;
  category_name?: string;
  type?: string;
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

  const { data, error } = await supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .gte("transaction_date", start)
    .lte("transaction_date", end)
    .order("transaction_date", { ascending: false });
  // .range(0, 999); // Remove any default limits by explicitly setting a large range

  if (error) throw error;
  return data;
}

export async function getFilteredTransactions(filters: FilterParams = {}) {
  let query = supabase.from("transactions").select("*", { count: "exact" });

  if (filters.id) {
    query = query.eq("id", filters.id);
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

  const { data, error } = await query.order("transaction_date", {
    ascending: false,
  });
  if (error) throw error;
  return data;
}

/**
 * Fetch ALL transactions for the current user (no date filter).
 */
export async function getAllTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .order("transaction_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createTransaction(
  transaction: Omit<Transaction, "id">,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .insert([transaction])
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
