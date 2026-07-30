import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, SlidersHorizontal, X, Timer, ShieldCheck } from "lucide-react";
import { AuctionCard } from "@/components/auction-card";
import { cn } from "@/lib/utils";
import { createServerClient } from "@/lib/supabase-server";

const sortOptions = [
  "ending-soon",
  "price-asc",
  "price-desc",
  "newest",
] as const;
type SortKey = (typeof sortOptions)[number];

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  body: fallback(z.string(), "").default(""),
  transmission: fallback(z.string(), "").default(""),
  fuel: fallback(z.string(), "").default(""),
  minPrice: fallback(z.number().optional(), undefined),
  maxPrice: fallback(z.number().optional(), undefined),
  minYear: fallback(z.number().optional(), undefined),
  maxYear: fallback(z.number().optional(), undefined),
  sort: fallback(z.enum(sortOptions), "ending-soon").default("ending-soon"),
  page: fallback(z.number().int().positive(), 1).default(1),
});

const PAGE_SIZE = 6;

export const Route = createFileRoute("/auction/")({
  validateSearch: zodValidator(searchSchema),
  loader: async () => {
    const supabase = createServerClient();
    if (!supabase) {
      return { auctions: [] };
    }

    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("is_auction", true)
      .order("auction_ends_at", { ascending: true });

    if (!data) {
      return { auctions: [] };
    }

    const withPhotos = await Promise.all(
      data.map(async (listing: any) => {
        const { data: photos } = await supabase
          .from("listing_photos")
          .select("storage_path")
          .eq("listing_id", listing.id)
          .order("sort_order", { ascending: true });

        return {
          ...listing,
          photos: photos?.map((p: any) => p.storage_path) || [],
        };
      }),
    );

    return { auctions: withPhotos };
  },
  head: () => ({
    meta: [
      { title: "Auction - Spice Got Cars" },
      {
        name: "description",
        content:
          "Bid on quality cars at Spice Got Cars auction. Starting bids, live countdowns, and transparent bidding.",
      },
    ],
  }),
  component: AuctionPage,
});

function AuctionPage() {
  const { auctions } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = useMemo(() => {
    return auctions.map((a: any) => ({
      id: a.id,
      make: a.make,
      model: a.model,
      trim: a.trim,
      year: a.year,
      startingBidKes: a.starting_bid_kes ?? a.price_kes,
      currentBidKes: a.current_bid_kes ?? a.price_kes,
      negotiable: a.negotiable,
      mileageKm: a.mileage_km,
      transmission: a.transmission,
      fuelType: a.fuel_type,
      engineSize: a.engine_size,
      bodyType: a.body_type,
      condition: a.condition,
      photos: a.photos ?? [],
      description: a.description,
      status: a.status === "sold" ? "sold" : a.status === "reserved" ? "ended" : a.auction_ends_at && new Date(a.auction_ends_at) < new Date() ? "ended" : "active",
      ntsaInspected: a.ntsa_inspected,
      logbookVerified: a.logbook_verified,
      endsAt: a.auction_ends_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      bidCount: a.bid_count ?? 0,
      highestBidder: a.highest_bidder,
    }));
  }, [auctions]);

  const results = useMemo(() => {
    const q = search.q.trim().toLowerCase();
    let out = items.filter((item) => {
      if (q) {
        const hay = `${item.make} ${item.model} ${item.trim ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (search.body && item.bodyType !== search.body) return false;
      if (search.transmission && item.transmission !== search.transmission)
        return false;
      if (search.fuel && item.fuelType !== search.fuel) return false;
      if (search.minPrice != null && item.currentBidKes < search.minPrice)
        return false;
      if (search.maxPrice != null && item.currentBidKes > search.maxPrice)
        return false;
      if (search.minYear != null && item.year < search.minYear) return false;
      if (search.maxYear != null && item.year > search.maxYear) return false;
      return true;
    });

    switch (search.sort) {
      case "price-asc":
        out = [...out].sort((a, b) => a.currentBidKes - b.currentBidKes);
        break;
      case "price-desc":
        out = [...out].sort((a, b) => b.currentBidKes - a.currentBidKes);
        break;
      case "newest":
        out = [...out].sort(
          (a, b) =>
            new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime(),
        );
        break;
      default:
        out = [...out].sort(
          (a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
        );
    }
    return out;
  }, [search, items]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(search.page || 1, totalPages);
  const pageItems = results.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const update = (patch: Record<string, unknown>) =>
    navigate({
      search: (prev: Record<string, unknown>) =>
        ({ ...prev, ...patch }) as never,
    });

  const clearAll = () =>
    navigate({
      search: {
        q: "",
        body: "",
        transmission: "",
        fuel: "",
        minPrice: undefined,
        maxPrice: undefined,
        minYear: undefined,
        maxYear: undefined,
        sort: "ending-soon",
        page: 1,
      },
    });

  const hasActiveFilters =
    !!search.q ||
    !!search.body ||
    !!search.transmission ||
    !!search.fuel ||
    search.minPrice != null ||
    search.maxPrice != null ||
    search.minYear != null ||
    search.maxYear != null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Page header */}
      <div className="mb-8 rounded-2xl bg-brand-navy p-8 text-white md:p-12">
        <h1 className="text-3xl font-bold md:text-5xl">
          Auctions are live! Find hidden gems
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-300">
          Bid on affordable damaged and used cars. A refundable deposit of{" "}
          <span className="font-bold text-white">KES 5,000</span> is required
          to place a bid. Payment must be completed within{" "}
          <span className="font-bold text-white">48 hours</span> of winning.
          Non-winners receive a full deposit refund within 3 business days.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold md:text-3xl">
          {results.length} {results.length === 1 ? "auction" : "auctions"} live
        </h2>
        <p className="text-brand-muted">
          Place your bid before time runs out. All vehicles are logbook-verified
          and NTSA-inspected.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search className="size-4 text-brand-muted" />
          <input
            value={search.q}
            onChange={(e) => update({ q: e.target.value, page: 1 })}
            placeholder="Search make or model..."
            className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-brand-muted focus:outline-none"
          />
        </div>
        <select
          value={search.sort}
          onChange={(e) => update({ sort: e.target.value as SortKey, page: 1 })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="ending-soon">Ending soon</option>
          <option value="price-asc">Bid: low to high</option>
          <option value="price-desc">Bid: high to low</option>
          <option value="newest">Newest listed</option>
        </select>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filters
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside
          className={cn(
            "space-y-6 rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24 lg:block lg:self-start",
            mobileOpen ? "block" : "hidden",
          )}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-brand-muted">
              Filters
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs font-bold text-brand-accent"
              >
                <X className="size-3" /> Clear
              </button>
            )}
          </div>

          <FilterGroup label="Body type">
            <FilterSelect
              value={search.body}
              onChange={(v) => update({ body: v, page: 1 })}
              options={[
                ["", "All"],
                ["SUV", "SUV"],
                ["Saloon", "Saloon"],
                ["Hatchback", "Hatchback"],
                ["Pickup", "Pickup"],
                ["Wagon", "Wagon"],
                ["Coupe", "Coupe"],
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Transmission">
            <FilterSelect
              value={search.transmission}
              onChange={(v) => update({ transmission: v, page: 1 })}
              options={[
                ["", "All"],
                ["Automatic", "Automatic"],
                ["Manual", "Manual"],
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Fuel">
            <FilterSelect
              value={search.fuel}
              onChange={(v) => update({ fuel: v, page: 1 })}
              options={[
                ["", "All"],
                ["Petrol", "Petrol"],
                ["Diesel", "Diesel"],
                ["Hybrid", "Hybrid"],
                ["Electric", "Electric"],
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Current bid (KES)">
            <div className="flex gap-2">
              <NumberInput
                placeholder="Min"
                value={search.minPrice}
                onChange={(v) => update({ minPrice: v, page: 1 })}
              />
              <NumberInput
                placeholder="Max"
                value={search.maxPrice}
                onChange={(v) => update({ maxPrice: v, page: 1 })}
              />
            </div>
          </FilterGroup>

          <FilterGroup label="Year">
            <div className="flex gap-2">
              <NumberInput
                placeholder="From"
                value={search.minYear}
                onChange={(v) => update({ minYear: v, page: 1 })}
              />
              <NumberInput
                placeholder="To"
                value={search.maxYear}
                onChange={(v) => update({ maxYear: v, page: 1 })}
              />
            </div>
          </FilterGroup>
        </aside>

        <div>
          {pageItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-lg font-semibold">
                No auctions match your filters.
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                Try clearing some filters or check back later.
              </p>
              <button
                onClick={clearAll}
                className="mt-4 rounded-lg bg-brand-navy px-5 py-2 text-sm font-bold text-white"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {pageItems.map((item) => (
                  <AuctionCard key={item.id} item={item} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() =>
                      update({ page: Math.max(1, safePage - 1) })
                    }
                    disabled={safePage <= 1}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => update({ page: p })}
                          className={cn(
                            "grid size-10 place-items-center rounded-lg text-sm font-bold transition-colors",
                            p === safePage
                              ? "bg-brand-navy text-white"
                              : "border border-slate-200 bg-white hover:bg-slate-50",
                          )}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    onClick={() =>
                      update({ page: Math.min(totalPages, safePage + 1) })
                    }
                    disabled={safePage >= totalPages}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Terms section */}
      <section className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 md:p-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">
              Auction terms and conditions
            </h2>
            <div className="mt-4 space-y-3 text-sm text-brand-muted">
              <p>
                <span className="font-bold text-brand-navy">Deposit:</span> A
                refundable deposit of <span className="font-bold">KES 5,000</span>{" "}
                is required to place a bid. Deposits are held securely during
                the auction period.
              </p>
              <p>
                <span className="font-bold text-brand-navy">Payment:</span>{" "}
                Winners must complete full payment within{" "}
                <span className="font-bold">48 hours</span> of auction close.
                Payment can be made via bank transfer or mobile money.
              </p>
              <p>
                <span className="font-bold text-brand-navy">Refunds:</span>{" "}
                Non-winning bidders receive full deposit refunds within 3
                business days. Refunds are processed to the original payment
                method.
              </p>
              <p>
                <span className="font-bold text-brand-navy">Bidding:</span> All
                bids are binding. By placing a bid, you agree to purchase the
                vehicle at your bid price if you are the highest bidder at
                auction close.
              </p>
            </div>
            <Link
              to="/terms"
              className="mt-6 inline-block rounded-lg bg-brand-navy px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
            >
              Read full terms and conditions
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl">
            <img
              src="/Hero Image.jpg"
              alt="Auction terms"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-navy">
        {label}
      </label>
      {children}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === "" ? undefined : Number(raw));
      }}
      className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
    />
  );
}
