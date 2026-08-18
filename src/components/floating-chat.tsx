import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Loader2 } from "lucide-react";
import { sendChatMessage } from "@/lib/chat-server";
import { Link } from "@tanstack/react-router";

function isInternalUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const parsed = new URL(url, origin);
    if (parsed.origin === origin) return true;
    if (parsed.hostname === "spicegotcars.co.ke" || parsed.hostname === "www.spicegotcars.co.ke") {
      return true;
    }
  } catch {
    // invalid URL
  }
  return false;
}

function toInternalHref(url: string): string {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : SITE_BASE_URL;
    const parsed = new URL(url, origin);
    if (parsed.origin === origin || parsed.hostname === "spicegotcars.co.ke" || parsed.hostname === "www.spicegotcars.co.ke") {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch {
    // invalid URL
  }
  return url;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[([^\]]+)\]\(([^)]+)\))|(https?:\/\/[^\s]+)|(\/[^\s]+)/g;
  let lastIndex = 0;
  let key = 0;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      const boldText = match[1].slice(2, -2);
      parts.push(<strong key={key++} className="font-semibold text-brand-navy">{boldText}</strong>);
    } else if (match[2]) {
      const italicText = match[2].slice(1, -1);
      parts.push(<em key={key++} className="italic">{italicText}</em>);
    } else if (match[3]) {
      const linkText = match[4];
      let url = match[5];
      url = url.replace(/[.,;:!?)]+$/, "");
      if (isInternalUrl(url)) {
        const href = toInternalHref(url);
        parts.push(
          <InternalLink key={key++} href={href}>
            {linkText}
          </InternalLink>,
        );
      } else {
        parts.push(<span key={key++}>{linkText}</span>);
      }
    } else if (match[6] || match[7]) {
      let url = match[0];
      url = url.replace(/[.,;:!?)]+$/, "");
      if (isInternalUrl(url)) {
        const href = toInternalHref(url);
        parts.push(
          <InternalLink key={key++} href={href}>
            {url}
          </InternalLink>,
        );
      } else {
        parts.push(<span key={key++}>{url}</span>);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function InternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link to={href} className="text-brand-accent underline">
      {children}
    </Link>
  );
}

function MessageContent({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);
  const elements: React.ReactNode[] = [];

  blocks.forEach((block, blockIndex) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    const lines = trimmed.split("\n");
    const listItems: string[] = [];
    const paragraphLines: string[] = [];

    lines.forEach((line) => {
      if (line.match(/^[-*]\s+/)) {
        listItems.push(line.replace(/^[-*]\s+/, ""));
      } else {
        paragraphLines.push(line);
      }
    });

    if (listItems.length > 0) {
      elements.push(
        <ul key={blockIndex} className="mb-2 list-disc space-y-1 pl-4 last:mb-0">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>,
      );
    }

    if (paragraphLines.length > 0) {
      const paragraphText = paragraphLines.join("\n");
      elements.push(
        <p key={`p-${blockIndex}`} className="mb-2 text-sm leading-relaxed last:mb-0">
          {renderInline(paragraphText)}
        </p>,
      );
    }
  });

  if (elements.length === 0) {
    return <>{content}</>;
  }

  return <>{elements}</>;
}

const SITE_BASE_URL = "https://spicegotcars.co.ke";

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([
    {
      role: "assistant",
      content:
        "Hi there! 👋 Welcome to Spice Got Cars. I'm your built-in assistant — I'm right here on the site. Ask me anything about our cars, services, or how to buy or sell with us.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: "user" as const, content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      console.log("[chat-ui] Sending message to server:", trimmed, "history length:", messages.length);
      const result = await sendChatMessage({
        data: {
          message: trimmed,
          history: messages,
        }
      });
      console.log("[chat-ui] Server response:", result);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.reply },
      ]);
    } catch (err: any) {
      console.error("[chat-ui] Chat frontend error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, something went wrong. Please try again or reach us on WhatsApp.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed right-4 bottom-[5.5rem] z-50 flex h-[min(500px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between bg-brand-navy px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="size-5" />
              <div>
                <h3 className="text-sm font-bold">Spice Got Cars</h3>
                <p className="text-xs text-white/70">Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === "user"
                        ? "rounded-br-sm bg-brand-accent text-white"
                        : "rounded-bl-sm bg-white text-brand-navy shadow-sm ring-1 ring-slate-100"
                    }`}
                  >
                    <MessageContent content={msg.content} />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-bl-sm rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                    <div className="flex items-center gap-1">
                      <span
                        className="size-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="size-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="size-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-brand-navy placeholder:text-slate-400 focus:border-brand-accent focus:bg-white focus:outline-none disabled:opacity-60"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="rounded-lg bg-brand-accent p-2 text-white transition-colors hover:bg-brand-accent-hover disabled:opacity-40"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="fixed right-4 bottom-4 z-50 flex size-14 items-center justify-center rounded-full bg-brand-accent text-white shadow-2xl shadow-emerald-900/30 ring-4 ring-white transition-transform hover:scale-105 active:scale-95 sm:right-5 sm:bottom-5"
      >
        {isOpen ? (
          <X className="size-6" />
        ) : (
          <MessageSquare className="size-6" />
        )}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-white" />
          </span>
        )}
      </button>
    </>
  );
}
