import { useRouterState } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { buildGeneralInquiryLink } from "@/lib/whatsapp";

export function FloatingWhatsApp() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/sell")) return null;

  return (
    <a
      href={buildGeneralInquiryLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Spice Got Cars on WhatsApp"
      className="fixed right-5 bottom-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-emerald-900/30 ring-4 ring-white transition-transform hover:scale-105 active:scale-95"
    >
      <span className="absolute -top-0.5 -right-0.5 flex size-3">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex size-3 rounded-full bg-white" />
      </span>
      <MessageCircle className="size-6 fill-white text-[#25D366]" />
    </a>
  );
}