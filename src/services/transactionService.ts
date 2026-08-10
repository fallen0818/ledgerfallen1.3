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
  id?: string;
  startDate?: string;
  endDate?: string;
  category_name?: string;
  type?: string;
}

export async function getTransactions(dateRange = getCurrentMonth()) {
  let start: string, end: string;

  if (dateRange.length === 4) {
    start = `${dateRange}-01-01`;
    end = `${dateRange}-12-31`;
  } else {
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
  // TEMPORARY DEBUG LOGGING — remove once the issue is found.
  console.log('[DEBUG] Raw transaction object received by createTransaction:', JSON.stringify(transaction, null, 2))

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Not signed in — cannot create a transaction without a user.");

  const payload = { ...transaction, user_id: user.id };
  console.log('[DEBUG] Full payload about to be sent to Supabase:', JSON.stringify(payload, null, 2))

  const { data, error } = await supabase
    .from("transactions")
    .insert([payload])
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