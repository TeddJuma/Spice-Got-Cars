"use server";

import { createClient } from "@supabase/supabase-js";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "sgc_agent_salt_2024");
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

export async function agentLogin(identifier: string, password: string) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !serviceRoleKey) {
    return { error: { message: "Supabase service role is not configured on the server" } };
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const trimmed = identifier.trim();
  let agentRow: any = null;

  const byEmail = await supabase
    .from("agents")
    .select("*")
    .eq("email", trimmed.toLowerCase())
    .maybeSingle();

  if (byEmail.data) {
    agentRow = byEmail.data;
  } else {
    const byPhone = await supabase
      .from("agents")
      .select("*")
      .eq("phone", trimmed)
      .maybeSingle();

    if (byPhone.data) {
      agentRow = byPhone.data;
    } else {
      const byId = await supabase
        .from("agents")
        .select("*")
        .eq("id_number", trimmed)
        .maybeSingle();

      agentRow = byId.data || null;
    }
  }

  if (!agentRow) {
    return { error: { message: "No account found with that email, phone, or ID number" } };
  }

  const verified = await verifyPassword(password, agentRow.password_hash);
  if (!verified) {
    return { error: { message: "Incorrect password" } };
  }

  return {
    success: true,
    agent: {
      id: agentRow.id,
      name: agentRow.name,
      email: agentRow.email,
      phone: agentRow.phone,
      id_number: agentRow.id_number,
      approved: agentRow.approved,
      approved_until: agentRow.approved_until,
      created_at: agentRow.created_at,
    },
  };
}
