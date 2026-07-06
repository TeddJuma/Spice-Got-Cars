import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? "";

export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
