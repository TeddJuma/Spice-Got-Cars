import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHONE_PRIMARY_DISPLAY, PHONE_PRIMARY_TEL } from "@/lib/whatsapp";

const logoUrl = "/logo.png";

const nav = [
  { to: "/inventory", label: "Inventory" },
  { to: "/services", label: "Services" },
  { to: "/sell", label: "Sell Your Car" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2"           aria-label="Spice Got Cars - home">
           <img src={logoUrl} alt="Spice Got Cars" className="h-[52px] w-auto sm:h-[62px]" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-brand-navy transition-colors hover:text-brand-accent"
              activeProps={{ className: "text-brand-accent" }}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`tel:${PHONE_PRIMARY_TEL}`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-accent-hover"
          >
            <Phone className="size-4" /> {PHONE_PRIMARY_DISPLAY}
          </a>
        </nav>

        <button
          className="grid size-10 place-items-center rounded-md text-brand-navy md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={cn("border-t border-slate-100 bg-white md:hidden", open ? "block" : "hidden")}
      >
        <nav className="mx-auto flex max-w-7xl flex-col px-4 py-2">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="border-b border-slate-100 py-3 text-sm font-medium text-brand-navy last:border-b-0"
              activeProps={{ className: "text-brand-accent" }}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`tel:${PHONE_PRIMARY_TEL}`}
            onClick={() => setOpen(false)}
            className="mt-2 mb-3 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-bold text-white"
          >
            <Phone className="size-4" /> Call {PHONE_PRIMARY_DISPLAY}
          </a>
        </nav>
      </div>
    </header>
  );
}
