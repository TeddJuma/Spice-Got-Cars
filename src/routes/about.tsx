import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, MapPin, HandshakeIcon, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Maclen Autos - Trusted Car Dealer in Ruaka" },
      {
        name: "description",
        content:
          "Maclen Autos Limited is a Ruaka-based car sales and reselling company serving buyers across Kenya. Verified logbooks, NTSA inspection, and honest service.",
      },
      { property: "og:title", content: "About Maclen Autos" },
      {
        property: "og:description",
        content:
          "Learn about Maclen Autos Limited, our Ruaka showroom, and why buyers across Kenya trust us.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
      <div className="mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
          Our story
        </span>
        <h1 className="mt-2 text-3xl font-bold md:text-5xl">
          Kenyan-owned. Ruaka-based. Nationwide reach.
        </h1>
      </div>

      <div className="prose prose-slate max-w-none">
        <p className="text-lg text-slate-700">
          Maclen Autos Limited is a car sales and reselling company built on a
          simple principle: buyers deserve honest information, fair prices, and
          a car that's ready to drive. From our yard on Limuru Road in Ruaka,
          we deliver vehicles to families and businesses across Kenya.
        </p>
        <p className="mt-4 text-slate-700">
          Every car in our inventory is inspected before it goes on sale.
          Ownership documents are verified, service history is checked where
          available, and mechanical issues are addressed by our in-house team.
          We stand behind the cars we sell.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <Feature
          icon={<ShieldCheck className="size-5 text-brand-accent" />}
          title="Verified paperwork"
          body="We confirm logbook ownership before a car is listed. No surprises after purchase."
        />
        <Feature
          icon={<HandshakeIcon className="size-5 text-brand-accent" />}
          title="Fair, transparent pricing"
          body="Our prices reflect real market value. Every listing states whether it's negotiable."
        />
        <Feature
          icon={<MapPin className="size-5 text-brand-accent" />}
          title="Serving all of Kenya"
          body="Buyers travel from Nakuru, Kisumu, Mombasa and beyond to view cars at our Ruaka yard."
        />
        <Feature
          icon={<Users className="size-5 text-brand-accent" />}
          title="People-first service"
          body="Most buyers reach us on WhatsApp or by phone. We reply personally and quickly."
        />
      </div>

      <div className="mt-12 rounded-2xl bg-brand-navy p-8 text-center text-white md:p-12">
        <h2 className="text-2xl font-bold md:text-3xl">
          Ready to find your next car?
        </h2>
        <p className="mt-2 text-slate-300">
          Browse the yard online or come visit us in Ruaka.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/inventory"
            className="rounded-lg bg-brand-accent px-6 py-3 text-sm font-bold text-white hover:bg-brand-accent-hover"
          >
            Browse inventory
          </Link>
          <Link
            to="/contact"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold hover:bg-white/10"
          >
            Visit our yard
          </Link>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-3 grid size-10 place-items-center rounded-lg bg-emerald-50">
        {icon}
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-brand-muted">{body}</p>
    </div>
  );
}