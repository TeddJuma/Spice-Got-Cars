import { Link } from "@tanstack/react-router";
import {
  CONTACT_EMAIL,
  PHONE_TEL,
  RUAKA_ADDRESS,
  WHATSAPP_DISPLAY,
  buildGeneralInquiryLink,
} from "@/lib/whatsapp";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 pt-16 pb-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <span className="mb-4 block text-2xl font-bold uppercase">
              Maclen Autos <span className="text-brand-accent">Ltd</span>
            </span>
            <p className="mb-6 max-w-sm text-brand-muted">
              Your trusted automotive partner in Ruaka. We deal in high-quality
              foreign-used and clean locally used vehicles for buyers all
              across Kenya.
            </p>
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
                href={`tel:${PHONE_TEL}`}
                className="block font-bold text-brand-navy"
              >
                {WHATSAPP_DISPLAY}
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
        <div className="border-t border-slate-100 pt-8 text-center">
          <p className="text-[10px] uppercase tracking-widest text-brand-muted">
            © {new Date().getFullYear()} Maclen Autos Limited. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}