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

type Props = {
  listingId: string;
  role: "admin" | "agent" | "customer";
  user: any; // admin or agent object, undefined for customer
  onClose: () => void;
};

export default function ChatPanel({ listingId, role, user, onClose }: Props) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Load or create conversation
  useEffect(() => {
    const init = async () => {
      try {
        if (role === "customer") {
          // wait for user to provide name/phone
          setLoading(false);
          return;
        }
        // admin or agent: fetch existing conversation for this listing
        const convs = await listConversationsForUser(user.id, role);
        const existing = (convs as Conversation[]).find((c) => c.listing_id === listingId);
        if (existing) {
          setConversation(existing);
        } else {
          // create a blank conversation (admin/agent can start)
          const conv = await createConversation({
            listingId,
            customerName: "",
            customerPhone: "",
          });
          setConversation(conv);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [listingId, role, user]);

  const handleStartConversation = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;
    const conv = await createConversation({ listingId, customerName, customerPhone });
    setConversation(conv);
  };

  const { messages, loading: msgsLoading, sendMessage } = useRealtimeMessages(conversation?.id ?? null);

  const [newContent, setNewContent] = useState("");
  const handleSend = async () => {
    if (!newContent.trim() || !conversation) return;
    await sendMessage(newContent, user?.id ?? null, role);
    setNewContent("");
  };

  const handleMarkRead = async () => {
    if (!conversation) return;
    await markMessagesRead({ conversationId: conversation.id, userId: user?.id ?? null });
  };

  if (loading) return <div className="p-4">Loading chat…</div>;

  // Customer first‑time view – ask for name & phone
  if (role === "customer" && !conversation) {
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
        {msgsLoading && <p className="text-sm text-muted-foreground">Loading messages…</p>}
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
      <div className="p-4 border-t flex space-x-2">
        <Input
          placeholder="Type a message…"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
        />
        <Button onClick={handleSend}>Send</Button>
        <Button variant="outline" onClick={handleMarkRead}>Mark read</Button>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
