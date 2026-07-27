import { createFileRoute, Link } from "@tanstack/react-router";
import { Ship, Repeat, Banknote, Handshake, Phone, MessageCircle, Car, FileText } from "lucide-react";
import {
  PHONE_PRIMARY_DISPLAY,
  PHONE_PRIMARY_TEL,
  buildGeneralInquiryLink,
} from "@/lib/whatsapp";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Services - Spice Got Cars" },
      {
        name: "description",
        content:
          "Spice Got Cars services: car imports, buy & sell used cars, salvage cars, logbook loans, trade-ins, and flexible finance options in Nairobi, Kenya.",
      },
      { property: "og:title", content: "Services - Spice Got Cars" },
      {
        property: "og:description",
        content:
          "Import cars, buy & sell used cars, salvage cars, logbook loans, trade-in, and finance options across Kenya.",
      },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
});

const services = [
  {
    icon: Ship,
    title: "Import Cars",
    body: "Order your next car directly from Japan, UK, or Dubai. We handle sourcing, shipping, clearing, and NTSA registration end-to-end - you receive a road-ready vehicle at our Kahawa west yard.",
    points: ["Verified auction sourcing", "Transparent landed pricing", "Duty & clearing handled"],
  },
  {
    icon: Handshake,
    title: "Buy & Sell Used Cars",
    body: "Browse a curated stock of foreign-used and clean locally used vehicles - every unit logbook-verified and NTSA-inspected. Selling? We list your car to our nationwide buyer network.",
    points: ["Inspected inventory", "Nationwide buyer reach", "Fast, fair valuations"],
  },
  {
    icon: Repeat,
    title: "Trade-In",
    body: "Upgrade without the hassle. Trade in your current car against any vehicle in our yard - we value it on the spot and apply the offer directly to your next purchase.",
    points: ["Same-day valuation", "Instant offset on price", "No middlemen"],
  },
  {
    icon: Banknote,
    title: "Finance Options",
    body: "Drive off with flexible financing through our partner banks and SACCOs. We help structure asset finance with competitive rates and short approval timelines.",
    points: ["Partner banks & SACCOs", "Up to 50% financing", "Approvals in days, not weeks"],
  },
  {
    icon: Car,
    title: "Salvage Cars",
    body: "Quality salvage vehicles inspected and cleared for the road. We offer transparent condition reports and value pricing on salvage units ready for repair or rebuild.",
    points: ["Inspected salvage units", "Transparent condition reports", "Great value pricing"],
  },
  {
    icon: FileText,
    title: "Logbook Loans",
    body: "Access fast financing against your vehicle's logbook. Competitive rates with flexible repayment terms - keep using your car while you repay.",
    points: ["Quick processing", "Competitive rates", "Keep driving your car"],
  },
];

function ServicesPage() {
  return (
    <>
      <section className="bg-brand-navy px-4 py-16 text-white md:py-20">
        <div className="mx-auto max-w-7xl">
          <span className="mb-4 inline-block rounded-full bg-brand-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-accent">
            Dealer in
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Everything you need to <span className="text-brand-accent">own the car</span> you want.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            From imports to trade-ins and finance, Spice Got Cars is a one-stop shop for buyers across Kenya.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <article
              key={s.title}
              className="rounded-2xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-lg"
            >
              <div className="mb-5 grid size-12 place-items-center rounded-xl bg-red-50 text-brand-accent">
                <s.icon className="size-6" />
              </div>
              <h2 className="text-2xl font-bold text-brand-navy">{s.title}</h2>
              <p className="mt-3 text-brand-muted">{s.body}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-accent" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-4xl rounded-2xl bg-brand-navy p-10 text-center text-white md:p-14">
          <h2 className="text-3xl font-bold md:text-4xl">Talk to a Spice Got Cars representative</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Call either line, or start a WhatsApp chat and we'll walk you through your options.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={`tel:${PHONE_PRIMARY_TEL}`}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-6 py-3 font-bold text-white transition-colors hover:bg-brand-accent-hover"
            >
              <Phone className="size-4" /> {PHONE_PRIMARY_DISPLAY}
            </a>
            <a
              href={buildGeneralInquiryLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-bold text-brand-navy transition-colors hover:bg-slate-100"
            >
              <MessageCircle className="size-4" /> WhatsApp us
            </a>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-bold text-white transition-colors hover:bg-white/10"
            >
              Browse inventory
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}