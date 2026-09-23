// src/lib/messaging.ts

import { supabase } from "@/lib/supabase";

export type Conversation = {
  id: string;
  listing_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_role: "admin" | "agent" | "customer";
  content: string;
  read: boolean;
  created_at: string;
};

function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function isSchemaCacheOrTableMissing(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || "").toLowerCase();
  const code = String(err.code || "");
  return (
    code === "PGRST205" ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table") ||
    msg.includes("does not exist") ||
    msg.includes("conversations") ||
    msg.includes("messages")
  );
}

// Local storage fallback handlers to support real-time chat even before migrations are run
const STORAGE_KEY_CONVS = "sgc_conversations";
const STORAGE_KEY_MSGS_PREFIX = "sgc_messages_";

export function getLocalConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalConversation(conv: Conversation) {
  if (typeof window === "undefined") return;
  try {
    const convs = getLocalConversations();
    const idx = convs.findIndex((c) => c.id === conv.id);
    if (idx >= 0) {
      convs[idx] = conv;
    } else {
      convs.unshift(conv);
    }
    localStorage.setItem(STORAGE_KEY_CONVS, JSON.stringify(convs));
  } catch (e) {
    console.error("[saveLocalConversation] error:", e);
  }
}

export function getLocalMessages(conversationId: string): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MSGS_PREFIX + conversationId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalMessage(msg: Message) {
  if (typeof window === "undefined") return;
  try {
    const msgs = getLocalMessages(msg.conversation_id);
    if (!msgs.some((m) => m.id === msg.id)) {
      msgs.push(msg);
      localStorage.setItem(STORAGE_KEY_MSGS_PREFIX + msg.conversation_id, JSON.stringify(msgs));
      window.dispatchEvent(new CustomEvent("sgc-new-message", { detail: msg }));
    }
  } catch (e) {
    console.error("[saveLocalMessage] error:", e);
  }
}

/**
 * Create a new conversation for a listing or agent support.
 * Gracefully handles missing database tables with local persistence + notifications.
 */
export async function createConversation(params: {
  listingId?: string;
  customerName?: string;
  customerPhone?: string;
}): Promise<Conversation> {
  const dbListingId = isUUID(params.listingId) ? params.listingId : null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          listing_id: dbListingId,
          customer_name: params.customerName ?? null,
          customer_phone: params.customerPhone ?? null,
        })
        .select()
        .single();

      if (!error && data) {
        return data as Conversation;
      }
      if (error && !isSchemaCacheOrTableMissing(error)) {
        console.warn("[createConversation] Supabase insert warning:", error);
      }
    } catch (err) {
      if (!isSchemaCacheOrTableMissing(err)) {
        console.warn("[createConversation] Supabase connection error:", err);
      }
    }
  }

  // Fallback to local conversation
  const fallbackConv: Conversation = {
    id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    listing_id: params.listingId ?? null,
    customer_name: params.customerName ?? null,
    customer_phone: params.customerPhone ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveLocalConversation(fallbackConv);

  // If customer provided info, also capture an inquiry in the database
  if (supabase && (params.customerName || params.customerPhone)) {
    try {
      await supabase.from("inquiries").insert({
        listing_id: dbListingId,
        name: params.customerName || "Website Visitor",
        phone: params.customerPhone || "N/A",
      });
    } catch {
      // non-critical
    }
  }

  return fallbackConv;
}

/** List all conversations a user (admin/agent/customer) participates in */
export async function listConversationsForUser(
  userId: string,
  role: "admin" | "agent" | "customer",
  extra?: { customerName?: string; customerPhone?: string },
): Promise<Conversation[]> {
  if (supabase) {
    try {
      if (role === "admin") {
        const { data, error } = await supabase.from("conversations").select("*");
        if (!error && data) return data as Conversation[];
      } else if (role === "agent") {
        const { data: agentListings, error: listingsError } = await supabase
          .from("listings")
          .select("id")
          .eq("agent_id", userId);

        if (!listingsError && agentListings && agentListings.length > 0) {
          const ids = agentListings.map((l: any) => l.id);
          const { data, error } = await supabase
            .from("conversations")
            .select("*")
            .in("listing_id", ids);
          if (!error && data) return data as Conversation[];
        }
      } else {
        const { data, error } = await supabase
          .from("conversations")
          .select("*")
          .eq("customer_name", extra?.customerName)
          .eq("customer_phone", extra?.customerPhone);
        if (!error && data) return data as Conversation[];
      }
    } catch {
      // fallback to local storage
    }
  }

  // Fallback: load local conversations
  const localConvs = getLocalConversations();
  if (role === "admin") {
    return localConvs;
  }
  if (role === "agent") {
    return localConvs.filter(
      (c) => c.listing_id && (c.listing_id.includes(userId) || isUUID(c.listing_id)),
    );
  }
  return localConvs.filter(
    (c) =>
      (!extra?.customerPhone || c.customer_phone === extra.customerPhone) &&
      (!extra?.customerName || c.customer_name === extra.customerName),
  );
}

/** Create a new message in a conversation */
export async function createMessage(params: {
  conversationId: string;
  senderId?: string | null;
  senderRole: "admin" | "agent" | "customer";
  content: string;
}): Promise<Message> {
  const isLocalId = params.conversationId.startsWith("conv-");

  // Determine listing id for notification reference
  let targetListing = "";
  try {
    const local = getLocalConversations().find((c) => c.id === params.conversationId);
    if (local?.listing_id) {
      targetListing = local.listing_id;
    }
  } catch {
    // ignore
  }

  if (!isLocalId && supabase && isUUID(params.conversationId)) {
    try {
      if (!targetListing) {
        const { data: convData } = await supabase
          .from("conversations")
          .select("listing_id")
          .eq("id", params.conversationId)
          .single();
        if (convData?.listing_id) {
          targetListing = convData.listing_id;
        }
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: params.conversationId,
          sender_id: params.senderId ?? null,
          sender_role: params.senderRole,
          content: params.content,
        })
        .select()
        .single();

      if (!error && data) {
        try {
          await supabase.from("notifications").insert({
            type: "new_message",
            message: `New chat (${params.senderRole})${targetListing ? ` [listing:${targetListing}]` : ""}: ${params.content.slice(0, 50)}...`,
          });
        } catch {
          // ignore
        }
        return data as Message;
      }
    } catch {
      // fallback
    }
  }

  // Fallback message
  const fallbackMsg: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    conversation_id: params.conversationId,
    sender_id: params.senderId ?? null,
    sender_role: params.senderRole,
    content: params.content,
    read: false,
    created_at: new Date().toISOString(),
  };

  saveLocalMessage(fallbackMsg);

  // Try to create notification for admin
  if (supabase) {
    try {
      await supabase.from("notifications").insert({
        type: "new_message",
        message: `New chat (${params.senderRole})${targetListing ? ` [listing:${targetListing}]` : ""}: ${params.content.slice(0, 50)}...`,
      });
    } catch {
      // ignore
    }
  }

  return fallbackMsg;
}

/** Fetch messages for a conversation, paginated */
export async function listMessages(params: {
  conversationId: string;
  limit?: number;
  offset?: number;
}): Promise<Message[]> {
  const isLocalId = params.conversationId.startsWith("conv-");

  if (!isLocalId && supabase && isUUID(params.conversationId)) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", params.conversationId)
        .order("created_at", { ascending: true })
        .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1);

      if (!error && data) {
        return data as Message[];
      }
    } catch {
      // fallback
    }
  }

  return getLocalMessages(params.conversationId);
}

/** Find existing conversation for a customer on a specific listing */
export async function findConversationForCustomer(listingId: string, customerName: string, customerPhone: string) {
  if (!supabase) {
    throw new Error("Supabase client is not configured. Please refresh the page.");
  }
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("listing_id", listingId)
      .eq("customer_name", customerName)
      .eq("customer_phone", customerPhone)
      .maybeSingle();
    if (error) throw error;
    return data as Conversation | null;
  } catch (e) {
    console.error("[findConversationForCustomer] error:", e);
    throw e;
  }
}

/** Mark messages as read */
export async function markMessagesRead(params: {
  conversationId: string;
  userId?: string | null;
}): Promise<void> {
  if (supabase && isUUID(params.conversationId)) {
    try {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", params.conversationId);
    } catch {
      // ignore
    }
  }

  // Local storage mark as read
  if (typeof window !== "undefined") {
    try {
      const msgs = getLocalMessages(params.conversationId);
      const updated = msgs.map((m) => ({ ...m, read: true }));
      localStorage.setItem(
        STORAGE_KEY_MSGS_PREFIX + params.conversationId,
        JSON.stringify(updated),
      );
    } catch {
      // ignore
    }
  }
}
