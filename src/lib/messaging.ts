// src/lib/messaging.ts

import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type Conversation = Database["public"]["Tables"]["conversations"]["Row"];

/**
 * Create a new conversation for a listing. Called when a customer first wants to chat.
 * Pass customer name & phone (stored on the conversation).
 */
export async function createConversation(params: {
  listingId?: string;
  customerName?: string;
  customerPhone?: string;
}) {
  if (!supabase) {
    throw new Error("Supabase client is not configured. Please refresh the page.");
  }
  try {
    const { data, error } = await supabase.from("conversations").insert({
      listing_id: params.listingId ?? null,
      customer_name: params.customerName ?? null,
      customer_phone: params.customerPhone ?? null,
    }).single();
    if (error) throw error;
    return data as Conversation;
  } catch (e) {
    console.error("[createConversation] error:", e);
    throw e;
  }
}

/** List all conversations a user (admin/agent/customer) participates in */
export async function listConversationsForUser(userId: string, role: "admin" | "agent" | "customer", extra?: {customerName?: string; customerPhone?: string}) {
  if (!supabase) {
    throw new Error("Supabase client is not configured. Please refresh the page.");
  }
  try {
    if (role === "admin") {
      const { data, error } = await supabase.from("conversations").select("*");
      if (error) throw error;
      return data as Conversation[];
    }
    if (role === "agent") {
      const { data: agentListings, error: listingsError } = await supabase
        .from("listings")
        .select("id")
        .eq("agent_id", userId);
      if (listingsError) {
        console.error("[listConversationsForUser] listings error:", listingsError);
        return [];
      }
      const listingIds = (agentListings?.data as any[]) || [];
      if (listingIds.length === 0) return [];
      const { data, error } = await supabase
        .from("conversations")
        .select("*", { count: "exact" })
        .in("listing_id", listingIds.map((l: any) => l.id));
      if (error) throw error;
      return data as Conversation[];
    }
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("customer_name", extra?.customerName)
      .eq("customer_phone", extra?.customerPhone);
    if (error) throw error;
    return data as Conversation[];
  } catch (e) {
    console.error("[listConversationsForUser] error:", e);
    throw e;
  }
}

/** Create a new message in a conversation */
export async function createMessage(params: {
  conversationId: string;
  senderId?: string;
  senderRole: "admin" | "agent" | "customer";
  content: string;
}) {
  if (!supabase) {
    throw new Error("Supabase client is not configured. Please refresh the page.");
  }
  try {
    const { data, error } = await supabase.from("messages").insert({
      conversation_id: params.conversationId,
      sender_id: params.senderId ?? null,
      sender_role: params.senderRole,
      content: params.content,
    }).single();
    if (error) throw error;

    try {
      const { data: conv } = await supabase.from("conversations").select("listing_id, customer_name").eq("id", params.conversationId).single();
      if (conv && conv.listing_id) {
        await supabase.from("notifications").insert({
          type: "new_message",
          message: `New chat message on ${conv.listing_id}${conv.customer_name ? ` — ${conv.customer_name}` : ""}`,
        });
      }
    } catch {
      // notification failure is non-critical
    }

    return data as Message;
  } catch (e) {
    console.error("[createMessage] error:", e);
    throw e;
  }
}

/** Fetch messages for a conversation, paginated */
export async function listMessages(params: { conversationId: string; limit?: number; offset?: number }) {
  if (!supabase) {
    throw new Error("Supabase client is not configured. Please refresh the page.");
  }
  const { data, error } = await supabase
    .from("messages")
    .select("*", { count: "exact" })
    .eq("conversation_id", params.conversationId)
    .order("created_at", { ascending: true })
    .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1);
  if (error) throw error;
  return data as Message[];
}

/** Mark messages as read */
export async function markMessagesRead(params: { conversationId: string; userId?: string | null }) {
  if (!supabase) {
    throw new Error("Supabase client is not configured. Please refresh the page.");
  }
  const { error } = await supabase
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", params.conversationId)
    .eq("sender_id", params.userId ?? "");
  if (error) throw error;
}