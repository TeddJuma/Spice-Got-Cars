import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Search, ShieldCheck, FileCheck, Award, Sparkles } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { fetchListings } from "@/data/listings-supabase";

export const Route = createFileRoute("/")({
  loader: async () => {
    const data = await fetchListings();
    return { featured: data.slice(0, 6) };
  },
  component: Index,
});

function Index() {
  const { featured } = Route.useLoaderData();

  return (
    <>
      {/* Hero */}
      <section className="px-4 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="max-w-xl">
              <span className="mb-4 inline-block rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-accent">
                Kahawa west, Nairobi
              </span>
              <h1 className="text-4xl leading-[1.15] font-bold text-brand-navy md:text-5xl lg:text-6xl">
                Find your next drive in{" "}
                <span className="text-brand-accent">pristine</span> condition.
              </h1>
              <p className="mt-6 text-lg text-brand-muted">
                Quality cars, salvage vehicles, and flexible financing. Every
                vehicle inspected, logbook-verified, and ready to drive off.
              </p>

              {/* Quick search */}
              <form
                action="/inventory"
                method="get"
                className="mt-8 rounded-2xl border border-slate-200 bg-white p-2 text-brand-navy shadow-lg md:flex-row"
              >
                <div className="flex flex-1 items-center gap-2 px-3">
                  <Search className="size-5 text-brand-muted" />
                  <input
                    name="q"
                    type="text"
                    placeholder="Search make or model (e.g. Prado)"
                    className="flex-1 bg-transparent py-3 text-sm placeholder:text-brand-muted focus:outline-none"
                  />
                </div>
                <div className="hidden h-8 w-px self-center bg-slate-200 md:block" />
                <select
                  name="body"
                  defaultValue=""
                  className="bg-transparent px-3 py-3 text-sm focus:outline-none"
                >
                  <option value="">All body types</option>
                  <option value="SUV">SUV</option>
                  <option value="Saloon">Saloon</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Wagon">Wagon</option>
                </select>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-accent px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-accent-hover md:w-auto"
                >
                  Search cars
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <Link
                  to="/inventory"
                  className="rounded-lg border border-slate-200 bg-white px-5 py-2 font-semibold text-brand-navy transition-colors hover:border-brand-accent hover:text-brand-accent"
                >
                  Browse all inventory
                </Link>
                <Link
                  to="/sell"
                  className="rounded-lg bg-brand-navy px-5 py-2 font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Sell your car
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl shadow-2xl">
                <img
                  src="/Hero Image.jpg"
                  alt="Spice Got Cars showroom"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-slate-100 bg-white py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
          <TrustItem stat="500+" label="Cars delivered" icon={<Award className="size-5 text-brand-accent" />} />
          {/* <TrustItem stat="12 yrs" label="Serving Kenya" icon={<Sparkles className="size-5 text-brand-accent" />} /> */}
          <TrustItem stat="100%" label="Logbook verified" icon={<FileCheck className="size-5 text-brand-accent" />} />
          <TrustItem stat="NTSA" label="Certified inspection" icon={<ShieldCheck className="size-5 text-brand-accent" />} />
        </div>
      </section>

      {/* Featured listings */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Latest arrivals</h2>
            <p className="text-brand-muted">
               Hand-picked vehicles fresh in our Kahawa west yard.
            </p>
          </div>
          <Link
            to="/inventory"
            className="text-sm font-bold text-brand-accent underline decoration-2 underline-offset-4"
          >
            View all inventory →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((car) => (
            <ListingCard key={car.id} car={car} />
          ))}
        </div>
      </section>

      {/* Sell CTA */}
      <section className="bg-slate-900 px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">
            Want to sell your car?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400">
            Skip the marketplace headaches. Send us your car's details and our
            team will get back to you with an offer or list it for our
            nationwide buyer network.
          </p>
          <div className="mb-12 grid gap-8 md:grid-cols-3">
            <SellStep n={1} title="Submit details" body="Send us photos and specs via our form." />
            <SellStep n={2} title="Spice Got Cars review" body="We inspect and give a fair offer." />
            <SellStep n={3} title="Fast sale" body="Cash offer or listed within 24 hours." />
          </div>
          <Link
            to="/sell"
            className="inline-block rounded-xl bg-white px-10 py-4 font-black uppercase tracking-wider text-brand-navy transition-colors hover:bg-slate-100"
          >
            Start Selling Today
          </Link>
        </div>
      </section>
    </>
  );
}

function TrustItem({
  stat,
  label,
  icon,
}: {
  stat: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-red-50">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold leading-tight">{stat}</div>
        <div className="text-xs uppercase tracking-wider text-brand-muted">
          {label}
        </div>
      </div>
    </div>
  );
}

function SellStep({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-brand-accent font-bold">
        {n}
      </div>
      <h4 className="font-bold">{title}</h4>
      <p className="mt-2 text-xs text-slate-400">{body}</p>
    </div>
  );
}
