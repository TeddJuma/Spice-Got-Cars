import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Clock, Mail, MessageCircle } from "lucide-react";
import {
  CONTACT_EMAIL,
  PHONE_TEL,
  RUAKA_ADDRESS,
  WHATSAPP_DISPLAY,
  buildGeneralInquiryLink,
} from "@/lib/whatsapp";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Maclen Autos — Ruaka, Kenya" },
      {
        name: "description",
        content:
          "Visit Maclen Autos on Limuru Road, Ruaka. Call, WhatsApp, or email us — we reply fast.",
      },
      { property: "og:title", content: "Contact Maclen Autos" },
      {
        property: "og:description",
        content: "Find us in Ruaka, or reach out on WhatsApp for a quick reply.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold md:text-4xl">Get in touch</h1>
        <p className="mt-2 text-brand-muted">
          Most buyers reach us on WhatsApp — expect a reply within minutes
          during business hours.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <ContactItem
            icon={<MapPin className="size-5 text-brand-accent" />}
            title="Visit our yard"
            body={RUAKA_ADDRESS}
          />
          <ContactItem
            icon={<Phone className="size-5 text-brand-accent" />}
            title="Call"
            body={
              <a
                href={`tel:${PHONE_TEL}`}
                className="font-bold text-brand-navy hover:text-brand-accent"
              >
                {WHATSAPP_DISPLAY}
              </a>
            }
          />
          <ContactItem
            icon={<MessageCircle className="size-5 text-brand-accent" />}
            title="WhatsApp"
            body={
              <a
                href={buildGeneralInquiryLink()}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-brand-accent"
              >
                Chat on WhatsApp →
              </a>
            }
          />
          <ContactItem
            icon={<Mail className="size-5 text-brand-accent" />}
            title="Email"
            body={
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-brand-navy hover:text-brand-accent"
              >
                {CONTACT_EMAIL}
              </a>
            }
          />
          <ContactItem
            icon={<Clock className="size-5 text-brand-accent" />}
            title="Business hours"
            body={
              <div className="text-sm">
                <div>Mon – Fri: 8:00 AM – 6:30 PM</div>
                <div>Saturday: 9:00 AM – 5:00 PM</div>
                <div className="text-brand-muted">Sunday: By appointment</div>
              </div>
            }
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <iframe
            title="Maclen Autos Ruaka location"
            src="https://www.google.com/maps?q=Ruaka+Town,+Limuru+Road,+Kenya&output=embed"
            className="h-[400px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}

function ContactItem({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-50">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-widest text-brand-muted">
          {title}
        </div>
        <div className="mt-1 text-sm">{body}</div>
      </div>
    </div>
  );
}