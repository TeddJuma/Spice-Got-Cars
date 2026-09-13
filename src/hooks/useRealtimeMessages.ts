// src/hooks/useRealtimeMessages.ts

"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { listMessages, Message, createMessage } from "@/lib/messaging";

const LOAD_TIMEOUT_MS = 8000;

export default function useRealtimeMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    timeoutRef.current = setTimeout(() => {
      if (isMounted) {
        setError("Timed out loading messages. Please try refreshing.");
        setLoading(false);
      }
    }, LOAD_TIMEOUT_MS);

    (async () => {
      try {
        const initial = await listMessages({ conversationId, limit: 100, offset: 0 });
        if (isMounted) setMessages(initial);
      } catch (e) {
        console.error("Failed to load messages", e);
        if (isMounted) setError("Failed to load messages.");
      } finally {
        if (isMounted) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !supabase) return;
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

  const sendMessage = async (content: string, senderId: string | null, senderRole: "admin" | "agent" | "customer") => {
    if (!conversationId) return;
    try {
      await createMessage({ conversationId, senderId, senderRole, content });
    } catch (e) {
      console.error("Failed to send message", e);
      throw e;
    }
  };

  return { messages, loading, error, sendMessage };
}