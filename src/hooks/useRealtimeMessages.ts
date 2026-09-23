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
    if (!conversationId) return;

    const handleCustomMsg = (event: Event) => {
      const customEvent = event as CustomEvent<Message>;
      if (customEvent.detail && customEvent.detail.conversation_id === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === customEvent.detail.id)) return prev;
          return [...prev, customEvent.detail];
        });
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("sgc-new-message", handleCustomMsg);
    }

    if (!supabase) {
      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("sgc-new-message", handleCustomMsg);
        }
      };
    }

    const channel = supabase.channel(`messages:${conversationId}`);
    const handler = (payload: any) => {
      const newMsg = payload.new as Message;
      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
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
      if (typeof window !== "undefined") {
        window.removeEventListener("sgc-new-message", handleCustomMsg);
      }
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (
    content: string,
    senderId: string | null,
    senderRole: "admin" | "agent" | "customer",
  ) => {
    if (!conversationId) return;
    try {
      const newMsg = await createMessage({ conversationId, senderId, senderRole, content });
      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (e) {
      console.error("Failed to send message", e);
      throw e;
    }
  };

  return { messages, loading, error, sendMessage };
}
