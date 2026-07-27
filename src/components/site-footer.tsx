import { Link } from "@tanstack/react-router";
import {
  CONTACT_EMAIL,
  RUAKA_ADDRESS,
  PHONE_PRIMARY_DISPLAY,
  PHONE_PRIMARY_TEL,
  buildGeneralInquiryLink,
} from "@/lib/whatsapp";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 pt-16 pb-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <h2>Spice Got Cars</h2>
            <p className="mb-6 max-w-sm text-brand-muted">
              Your trusted automotive partner in Kahawa west. We deal in high-quality
              foreign-used and clean locally used vehicles for buyers all
              across Kenya. Import, buy &amp; sell, salvage cars, logbook loans,
              trade-in, and finance options available.
            </p>
            <div className="mb-4 overflow-hidden rounded-xl border border-slate-200">
              <iframe
                title="Spice Got Cars Kahawa west location"
                src={`https://www.google.com/maps?q=Kahawa+west+Kamiti+Road,+Nairobi,+Kenya&z=16&output=embed`}
                className="h-40 w-full md:w-80"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <strong className="font-semibold">Location:</strong>{" "}
                {RUAKA_ADDRESS}
              </p>
              <p>
                <strong className="font-semibold">Hours:</strong> Mon – Sat,
                8:00 AM – 6:30 PM
              </p>
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-muted">
              Explore
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <Link to="/inventory" className="hover:text-brand-accent">
                  Browse Inventory
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-brand-accent">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-brand-accent">
                  Sell Your Car
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-accent">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-accent">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-muted">
              Talk to us
            </h4>
            <div className="space-y-3 text-sm">
              <a
                href={`tel:${PHONE_PRIMARY_TEL}`}
                className="block font-bold text-brand-navy"
              >
                {PHONE_PRIMARY_DISPLAY}
              </a>
              <a
                href={buildGeneralInquiryLink()}
                target="_blank"
                rel="noreferrer"
                className="block font-bold text-brand-accent"
              >
                Chat on WhatsApp
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="block text-brand-muted"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-6 text-center">
          <Link
            to="/login"
            aria-label="Owner Login"
            className="inline-flex size-9 items-center justify-center rounded-full text-brand-muted transition-all duration-300 [filter:drop-shadow(0_0_0_rgba(239,68,68,0))] hover:text-red-400 hover:[filter:drop-shadow(0_0_10px_rgba(239,68,68,0.85))]"
          >
            <svg
              viewBox="0 0 64 32"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 23 L3 18.5 Q3 16.5 6 15.5 L17 14.5 L24 8.5 Q26 6.5 29 6.5 L40 6.5 Q43 6.5 45.5 9.5 L51 15 L60 16 Q62.5 16.5 62.5 19 L62.5 23" />
              <circle cx="16" cy="23" r="4.5" />
              <circle cx="48" cy="23" r="4.5" />
            </svg>
          </Link>
        </div>
        <div className="border-t border-slate-100 pt-8 text-center">
          <p className="text-[10px] uppercase tracking-widest text-brand-muted">
            © {new Date().getFullYear()} Spice Got Cars. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}