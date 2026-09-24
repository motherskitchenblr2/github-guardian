import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn("Failed to initialize Supabase client:", err);
  }
}

export const supabase = client;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

export async function logRunToSupabase(runData: {
  account: string;
  duration_seconds: number;
  prs_evaluated: number;
  prs_merged: number;
  prs_rebased: number;
  forks_synced: number;
  forks_up_to_date: number;
  forks_conflicts: number;
  secrets_flagged: number;
  repos_hardened: number;
  summary_report: any;
}) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("guardian_runs").insert([runData]).select();
    if (error) console.error("Supabase insert error:", error);
    return data;
  } catch (e) {
    console.error("Supabase exception:", e);
    return null;
  }
}

export async function getHistoricalRunsFromSupabase(limit = 10) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("guardian_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("Supabase query error:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("Supabase query exception:", e);
    return [];
  }
}
