// src/components/messaging/ChatPanel.tsx

"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import {
  createConversation,
  listConversationsForUser,
  Conversation,
  Message,
} from "@/lib/messaging";
import useRealtimeMessages from "@/hooks/useRealtimeMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  MessageSquare,
  ShieldCheck,
  User,
  Briefcase,
  Phone,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  listingId: string;
  role: "admin" | "agent" | "customer";
  user: any;
  onClose: () => void;
};

const BUSINESS_HOURS = "Monday–Friday, 9:00 AM – 4:00 PM (EAT)";
const LOCAL_STORAGE_CUSTOMER_KEY = "sgc_chat_customer_info";

export default function ChatPanel({ listingId, role, user, onClose }: Props) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [initError, setInitError] = useState<string | null>(null);
  const [showStartForm, setShowStartForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [sending, setSending] = useState(false);
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  // Auto-fill customer info from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOMER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setCustomerName(parsed.name);
        if (parsed.phone) setCustomerPhone(parsed.phone);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setInitError(null);
        if (role === "customer") {
          // If customer info is already in localStorage, attempt to auto-connect
          const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOMER_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.name && parsed.phone) {
                const conv = await createConversation({
                  listingId,
                  customerName: parsed.name,
                  customerPhone: parsed.phone,
                });
                setConversation(conv);
                setShowStartForm(false);
                setLoading(false);
                return;
              }
            } catch {
              // fallback to form
            }
          }
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
            customerName: role === "agent" ? (user?.name ?? "Agent") : "Dealership Customer",
            customerPhone: role === "agent" ? (user?.phone ?? "") : "",
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
    if (!customerName.trim() || !customerPhone.trim()) return;
    try {
      localStorage.setItem(
        LOCAL_STORAGE_CUSTOMER_KEY,
        JSON.stringify({ name: customerName.trim(), phone: customerPhone.trim() }),
      );
      const conv = await createConversation({
        listingId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      });
      setConversation(conv);
      setShowStartForm(false);
      toast.success("Connected to chat.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to start conversation.");
    }
  };

  const {
    messages,
    loading: msgsLoading,
    error: msgsError,
    sendMessage,
  } = useRealtimeMessages(conversation?.id ?? null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newContent.trim() || !conversation) return;
    setSending(true);
    try {
      await sendMessage(newContent.trim(), user?.id ?? "unknown", role);
      setNewContent("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-navy border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Connecting to secure chat...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="space-y-4 p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-sm font-semibold text-amber-900">Direct Chat Offline</p>
          <p className="mt-1 text-xs text-amber-800">
            We could not establish direct database connection. You can proceed with offline chat or
            contact us directly on WhatsApp.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="bg-brand-navy text-white hover:bg-slate-800"
            onClick={() => {
              setInitError(null);
              setShowStartForm(true);
            }}
          >
            Open Chat Anyway
          </Button>
          <a
            href="https://wa.me/254790555421"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#20b858]"
          >
            <MessageCircle className="size-3.5" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  if (role === "customer" && showStartForm) {
    return (
      <div className="p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-white font-black text-xs shadow">
              C
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-navy">Start Customer Chat</h3>
              <p className="text-xs text-brand-muted">
                Discuss vehicle inquiries directly with Spice Got Cars admins and agents
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleStartConversation} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Full Name
            </label>
            <Input
              placeholder="e.g. John Kamau"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number (for call/WhatsApp replies)
            </label>
            <Input
              placeholder="e.g. 0712 345 678"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-brand-navy hover:bg-slate-800 text-white font-semibold"
          >
            Join Chat as Customer
          </Button>
        </form>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <a
            href="https://wa.me/254790555421"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-1"
          >
            <MessageCircle className="size-3.5" />
            Prefer WhatsApp? Click here
          </a>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  // Determine participant party attributes
  const isAgentListing = listingId.startsWith("agent-");

  return (
    <div className="flex flex-col h-[70vh] max-h-[620px] bg-slate-50/50">
      {/* Participant Identity Bar / Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Parties in this chat:
            </span>
            {/* Admin Tag */}
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-amber-300 ring-1 ring-amber-400/40">
              <span className="flex size-4 items-center justify-center rounded-full bg-amber-400 font-black text-slate-950 text-[9px]">
                A
              </span>
              Admin
            </span>

            {/* Agent Tag */}
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-900 ring-1 ring-emerald-300">
              <span className="flex size-4 items-center justify-center rounded-full bg-emerald-600 font-black text-white text-[9px]">
                G
              </span>
              Agent
            </span>

            {/* Customer Tag */}
            {!isAgentListing && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-900 ring-1 ring-blue-300">
                <span className="flex size-4 items-center justify-center rounded-full bg-blue-600 font-black text-white text-[9px]">
                  C
                </span>
                Customer
              </span>
            )}
          </div>

          {conversation?.customer_name && (
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-brand-navy">{conversation.customer_name}</span>
              {conversation.customer_phone && (
                <span className="ml-1 text-slate-400">({conversation.customer_phone})</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <ScrollArea className="flex-1 p-4">
        {msgsLoading && !msgsError && (
          <div className="p-4 text-center text-xs text-slate-400">
            Loading conversation history…
          </div>
        )}
        {msgsError && (
          <div className="p-3 my-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {msgsError}
          </div>
        )}

        {messages.length === 0 && !msgsLoading && (
          <div className="flex h-48 flex-col items-center justify-center text-center p-6">
            <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <MessageSquare className="size-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No messages yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Send a message below. Messages are marked by party ([A] Admin, [G] Agent, [C]
              Customer) so everyone is easily identified.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg) => {
            const senderRole = msg.sender_role || "customer";
            const isMe =
              (role === "customer" && senderRole === "customer") ||
              (role === "admin" && senderRole === "admin") ||
              (role === "agent" &&
                senderRole === "agent" &&
                (!msg.sender_id || !user?.id || msg.sender_id === user.id));

            // Party identification configuration
            let partyLetter = "C";
            let partyRoleName = "Customer";
            let partyDisplayName = conversation?.customer_name || "Customer";
            let avatarClass = "bg-blue-600 text-white border-2 border-blue-200";
            let badgeClass = "bg-blue-100 text-blue-900 border border-blue-300";
            let bubbleClass = isMe
              ? "bg-blue-600 text-white rounded-2xl rounded-tr-xs"
              : "bg-blue-50 text-blue-950 border border-blue-200 rounded-2xl rounded-tl-xs";
            let timeClass = isMe ? "text-blue-200" : "text-blue-600/70";

            if (senderRole === "admin") {
              partyLetter = "A";
              partyRoleName = "Admin";
              partyDisplayName = "Dealership Admin";
              avatarClass = "bg-slate-900 text-amber-400 border-2 border-amber-400/50";
              badgeClass = "bg-slate-900 text-amber-300 border border-slate-700";
              bubbleClass = isMe
                ? "bg-slate-900 text-white border border-slate-800 rounded-2xl rounded-tr-xs"
                : "bg-slate-900 text-slate-50 border border-slate-700 rounded-2xl rounded-tl-xs";
              timeClass = "text-slate-400";
            } else if (senderRole === "agent") {
              partyLetter = "G";
              partyRoleName = "Agent";
              partyDisplayName = "Verified Agent";
              avatarClass = "bg-emerald-600 text-white border-2 border-emerald-300";
              badgeClass = "bg-emerald-100 text-emerald-900 border border-emerald-300";
              bubbleClass = isMe
                ? "bg-emerald-700 text-white rounded-2xl rounded-tr-xs"
                : "bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-2xl rounded-tl-xs";
              timeClass = isMe ? "text-emerald-200" : "text-emerald-700/70";
            }

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Party Letter Avatar */}
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-sm select-none ${avatarClass}`}
                  title={`${partyDisplayName} ([${partyLetter}] ${partyRoleName})`}
                >
                  {partyLetter}
                </div>

                <div
                  className={`flex flex-col max-w-[82%] sm:max-w-md ${isMe ? "items-end" : "items-start"}`}
                >
                  {/* Party Label & Name Header */}
                  <div
                    className={`mb-1 flex items-center gap-1.5 px-1 text-[11px] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <span
                      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[10px] font-black ${badgeClass}`}
                    >
                      [{partyLetter}] {partyRoleName}
                    </span>
                    <span className="font-semibold text-slate-700 truncate max-w-[140px]">
                      {partyDisplayName}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-bold text-brand-navy bg-slate-200/80 px-1 rounded">
                        You
                      </span>
                    )}
                  </div>

                  {/* Chat Bubble with Distinct Shape and Styling */}
                  <div className={`px-4 py-2.5 text-sm shadow-sm break-words ${bubbleClass}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <div
                      className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] font-medium ${timeClass}`}
                    >
                      <span>
                        {msg.created_at
                          ? new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Just now"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollBottomRef} />
        </div>
      </ScrollArea>

      {/* Input / Composer Area */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>
            You are chatting as:{" "}
            <strong className="text-brand-navy">
              [{role === "admin" ? "A" : role === "agent" ? "G" : "C"}]{" "}
              {role === "admin" ? "Admin" : role === "agent" ? "Agent" : "Customer"}
            </strong>
          </span>
          <span className="hidden sm:inline text-slate-400">{BUSINESS_HOURS}</span>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={`Message as ${role === "admin" ? "[A] Admin" : role === "agent" ? "[G] Agent" : "[C] Customer"}…`}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="bg-slate-50 focus-visible:bg-white"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !newContent.trim()}
            className="bg-brand-navy hover:bg-slate-800 text-white font-bold shrink-0"
          >
            <Send className="mr-1.5 size-4" />
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
