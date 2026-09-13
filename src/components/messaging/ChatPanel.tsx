// src/components/messaging/ChatPanel.tsx

"use client";

import { useEffect, useState, FormEvent } from "react";

import {
  createConversation,
  listConversationsForUser,
  createMessage,
  listMessages,
  markMessagesRead,
  Conversation,
  Message,
} from "@/lib/messaging";
import useRealtimeMessages from "@/hooks/useRealtimeMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

type Props = {
  listingId: string;
  role: "admin" | "agent" | "customer";
  user: any;
  onClose: () => void;
};

const BUSINESS_HOURS = "Monday–Friday, 9:00 AM – 4:00 PM (EAT)";

export default function ChatPanel({ listingId, role, user, onClose }: Props) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [initError, setInitError] = useState<string | null>(null);
  const [showStartForm, setShowStartForm] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setInitError(null);
        if (role === "customer") {
          setLoading(false);
          setShowStartForm(true);
          return;
        }
        const convs = await listConversationsForUser(user?.id ?? "unknown", role);
        const existing = (convs as Conversation[]).find((c) => c.listing_id === listingId);
        if (existing) {
          setConversation(existing);
        } else {
          const conv = await createConversation({
            listingId,
            customerName: "",
            customerPhone: "",
          });
          setConversation(conv);
        }
      } catch (e: any) {
        console.error(e);
        setInitError(e?.message || "Failed to initialize chat");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [listingId, role, user]);

  const handleStartConversation = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;
    try {
      const conv = await createConversation({ listingId, customerName, customerPhone });
      setConversation(conv);
      setShowStartForm(false);
      toast.success("Conversation started.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to start conversation.");
    }
  };

  const { messages, loading: msgsLoading, error: msgsError, sendMessage } = useRealtimeMessages(conversation?.id ?? null);

  const [newContent, setNewContent] = useState("");
  const [sending, setSending] = useState(false);
  const handleSend = async () => {
    if (!newContent.trim() || !conversation) return;
    setSending(true);
    try {
      await sendMessage(newContent, user?.id ?? "unknown", role);
      setNewContent("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async () => {
    if (!conversation) return;
    try {
      await markMessagesRead({ conversationId: conversation.id, userId: user?.id ?? null });
    } catch {
      toast.error("Failed to mark messages as read.");
    }
  };

  if (loading) return <div className="p-4">Loading chat…</div>;

  if (initError) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-sm text-red-700">{initError}</p>
        <p className="text-xs text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  if (role === "customer" && showStartForm) {
    return (
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-medium">Start a conversation</h3>
        <form onSubmit={handleStartConversation} className="space-y-2">
          <Input placeholder="Your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          <Input placeholder="Phone number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
          <Button type="submit" className="w-full">Start chat</Button>
        </form>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[70vh]">
      <ScrollArea className="flex-1 p-4">
        {msgsLoading && !msgsError && <p className="text-sm text-muted-foreground">Loading messages…</p>}
        {msgsError && <p className="text-sm text-red-700">{msgsError}</p>}
        {messages.map((msg) => (
          <div key={msg.id} className="mb-4 flex items-start">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage />
              <AvatarFallback>{msg.sender_role?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded px-3 py-2 max-w-xs break-words">
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(msg.created_at!).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 border-t space-y-2">
        <p className="text-[10px] text-muted-foreground">
          Response times may vary. SGC team is available {BUSINESS_HOURS}.
        </p>
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message…"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          />
          <Button onClick={handleSend} disabled={sending}>
            {sending ? "Sending…" : "Send"}
          </Button>
          <Button variant="outline" onClick={handleMarkRead}>Mark read</Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}