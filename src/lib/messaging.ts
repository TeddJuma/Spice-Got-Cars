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
  listingId: string;
  customerName: string;
  customerPhone: string;
}) {
  const { data, error } = await supabase.from("conversations").insert({
    listing_id: params.listingId,
    customer_name: params.customerName,
    customer_phone: params.customerPhone,
  }).single();
  if (error) throw error;
  return data as Conversation;
}

/** Fetch a conversation by its id */
export async function getConversation(conversationId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();
  if (error) throw error;
  return data as Conversation;
}

/** List all conversations a user (admin/agent/customer) participates in */
export async function listConversationsForUser(userId: string, role: "admin" | "agent" | "customer", extra?: {customerName?: string; customerPhone?: string}) {
  if (role === "admin") {
    // admin sees everything
    const { data, error } = await supabase.from("conversations").select("*");
    if (error) throw error;
    return data as Conversation[];
  }
  if (role === "agent") {
    // agent sees conversations of listings they own
    const { data, error } = await supabase
      .from("conversations")
      .select("*", { count: "exact" })
      .in("listing_id", supabase.from("listings").select("id").eq("agent_id", userId).toString());
    if (error) throw error;
    return data as Conversation[];
  }
  // customer – find by name+phone stored in JWT claims
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("customer_name", extra?.customerName)
    .eq("customer_phone", extra?.customerPhone);
  if (error) throw error;
  return data as Conversation[];
}

/** Create a new message in a conversation */
export async function createMessage(params: {
  conversationId: string;
  senderId?: string; // null for customers
  senderRole: "admin" | "agent" | "customer";
  content: string;
}) {
  const { data, error } = await supabase.from("messages").insert({
    conversation_id: params.conversationId,
    sender_id: params.senderId ?? null,
    sender_role: params.senderRole,
    content: params.content,
  }).single();
  if (error) throw error;
  return data as Message;
}

/** Fetch messages for a conversation, paginated */
export async function listMessages(params: { conversationId: string; limit?: number; offset?: number }) {
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
export async function markMessagesRead(messageIds: string[]) {
  const { data, error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .in("id", messageIds);
  if (error) throw error;
  return data;
}
