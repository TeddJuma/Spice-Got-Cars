// src/hooks/useRealtimeMessages.ts

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { listMessages, Message, createMessage } from "@/lib/messaging";

/**
 * Hook to manage realtime messages for a conversation.
 * It loads existing messages and subscribes to new inserts via Supabase Realtime.
 */
export default function useRealtimeMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial messages when conversationId becomes available
  useEffect(() => {
    if (!conversationId) return;
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const initial = await listMessages({ conversationId, limit: 100, offset: 0 });
        if (isMounted) setMessages(initial);
      } catch (e) {
        console.error("Failed to load messages", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  // Subscribe to realtime INSERT events for the conversation
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel("public:messages");
    const handler = (payload: any) => {
      const newMsg = payload.new as Message;
      setMessages((prev) => [...prev, newMsg]);
    };
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        handler,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Helper to send a message
  const sendMessage = async (content: string, senderId: string | null, senderRole: "admin" | "agent" | "customer") => {
    if (!conversationId) return;
    try {
      await createMessage({ conversationId, senderId, senderRole, content });
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  return { messages, loading, sendMessage };
}
