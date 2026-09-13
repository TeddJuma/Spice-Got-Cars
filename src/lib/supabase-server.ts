import { createClient } from "@supabase/supabase-js";

function getEnv(key: string, viteKey?: string): string {
  if (typeof process !== "undefined" && process.env) {
    if (process.env[key]) return process.env[key]!;
    if (viteKey && process.env[viteKey]) return process.env[viteKey]!;
  }
  if (typeof import.meta !== "undefined" && import.meta.env) {
    if (viteKey && import.meta.env[viteKey]) return import.meta.env[viteKey];
    if (import.meta.env[key]) return import.meta.env[key];
  }
  return "";
}

export function getSupabaseUrl() {
  return getEnv("SUPABASE_URL", "VITE_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return getEnv("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return getEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export const supabaseUrl = getSupabaseUrl();
export const supabaseAnonKey = getSupabaseAnonKey();
export const supabaseServiceRoleKey = getSupabaseServiceRoleKey();

export function createServerClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    return null;
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

export function createServiceClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!url || !serviceRoleKey) {
    return null;
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
