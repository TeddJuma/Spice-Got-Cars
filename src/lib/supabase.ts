import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  "";

export const supabaseAnonKey =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)) ||
  "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "sgc-supabase-auth",
        },
      })
    : null;

export function createClient() {
  return supabase;
}
