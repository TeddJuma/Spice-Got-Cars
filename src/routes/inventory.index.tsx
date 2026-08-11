import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  type Car,
  type Condition,
  type FuelType,
  type Transmission,
} from "@/data/listings";
import { ListingCard } from "@/components/listing-card";
import { cn } from "@/lib/utils";
import { fetchListings, fetchFilterOptions } from "@/data/listings-supabase";

const sortOptions = [
  "newest",
  "price-asc",
  "price-desc",
  "year-desc",
  "mileage-asc",
] as const;
type SortKey = (typeof sortOptions)[number];

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  make: fallback(z.string(), "").default(""),
  model: fallback(z.string(), "").default(""),
  location: fallback(z.string(), "").default(""),
  transmission: fallback(z.string(), "").default(""),
  fuel: fallback(z.string(), "").default(""),
  condition: fallback(z.string(), "").default(""),
  minPrice: fallback(z.number().optional(), undefined),
  maxPrice: fallback(z.number().optional(), undefined),
  minYear: fallback(z.number().optional(), undefined),
  maxYear: fallback(z.number().optional(), undefined),
  sort: fallback(z.enum(sortOptions), "newest").default("newest"),
});

export const Route = createFileRoute("/inventory/")({
  validateSearch: zodValidator(searchSchema),
  loader: async () => {
    const [listings, filterOptions] = await Promise.all([
      fetchListings(false),
      fetchFilterOptions(),
    ]);
    return { listings, filterOptions };
  },
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-brand-muted">{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded-lg bg-brand-navy px-5 py-2 text-sm font-bold text-white"
      >
        Retry
      </button>
    </div>
  ),
  head: () => ({
    meta: [
      { title: "Inventory - Spice Got Cars Nairobi" },
      {
        name: "description",
        content:
          "Browse verified cars for sale at Spice Got Cars in Nairobi. Filter by price, year, body type, transmission and fuel type.",
      },
      { property: "og:title", content: "Spice Got Cars Inventory" },
      {
        property: "og:description",
        content:
          "Verified used and new cars across Kenya. Foreign used and locally used vehicles, all NTSA-inspected.",
      },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { listings, filterOptions } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const results = useMemo(() => {
    const q = search.q.trim().toLowerCase();
    let out = listings.filter((car) => {
      if (q) {
        const hay = `${car.make} ${car.model} ${car.trim ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (search.make && car.make !== search.make) return false;
      if (search.model && car.model !== search.model) return false;
      if (search.location && car.location !== search.location) return false;
      if (search.transmission && car.transmission !== search.transmission)
        return false;
      if (search.fuel && car.fuelType !== search.fuel) return false;
      if (search.condition && car.condition !== search.condition) return false;
      if (search.minPrice != null && car.priceKes < search.minPrice)
        return false;
      if (search.maxPrice != null && car.priceKes > search.maxPrice)
        return false;
      if (search.minYear != null && car.year < search.minYear) return false;
      if (search.maxYear != null && car.year > search.maxYear) return false;
      return true;
    });

    switch (search.sort) {
      case "price-asc":
        out = [...out].sort((a, b) => a.priceKes - b.priceKes);
        break;
      case "price-desc":
        out = [...out].sort((a, b) => b.priceKes - a.priceKes);
        break;
      case "year-desc":
        out = [...out].sort((a, b) => b.year - a.year);
        break;
      case "mileage-asc":
        out = [...out].sort((a, b) => a.mileageKm - b.mileageKm);
        break;
      default:
        out = [...out].sort(
          (a, b) =>
            new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime(),
        );
    }
    return out;
  }, [search]);

  const update = (patch: Record<string, unknown>) =>
    navigate({
      search: (prev: Record<string, unknown>) =>
        ({ ...prev, ...patch }) as never,
    });

  const clearAll = () =>
    navigate({
      search: {
        q: "",
        make: "",
        model: "",
        location: "",
        transmission: "",
        fuel: "",
        condition: "",
        minPrice: undefined,
        maxPrice: undefined,
        minYear: undefined,
        maxYear: undefined,
        sort: "newest",
      },
    });

  const hasActiveFilters =
    !!search.q ||
    !!search.make ||
    !!search.model ||
    !!search.location ||
    !!search.transmission ||
    !!search.fuel ||
    !!search.condition ||
    search.minPrice != null ||
    search.maxPrice != null ||
    search.minYear != null ||
    search.maxYear != null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold md:text-4xl">Inventory</h1>
        <p className="text-brand-muted">
          {results.length}{" "}
          {results.length === 1 ? "vehicle" : "vehicles"} available
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search className="size-4 text-brand-muted" />
          <input
            value={search.q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search make or model..."
            className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-brand-muted focus:outline-none"
          />
        </div>
        <select
          value={search.sort}
          onChange={(e) => update({ sort: e.target.value as SortKey })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="newest">Newest listed</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="year-desc">Year: newest</option>
          <option value="mileage-asc">Mileage: lowest</option>
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

          <FilterGroup label="Make">
            <FilterSelect
              value={search.make}
              onChange={(v) => update({ make: v })}
              options={[
                ["", "All"],
                ...filterOptions.makes.map((m) => [m, m] as [string, string]),
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Model">
            <FilterSelect
              value={search.model}
              onChange={(v) => update({ model: v })}
              options={[
                ["", "All"],
                ...filterOptions.models.map((m) => [m, m] as [string, string]),
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Location">
            <FilterSelect
              value={search.location}
              onChange={(v) => update({ location: v })}
              options={[
                ["", "All"],
                ...filterOptions.locations.map((l) => [l, l] as [string, string]),
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Transmission">
            <FilterSelect
              value={search.transmission}
              onChange={(v) => update({ transmission: v })}
              options={[
                ["", "All"],
                ...(["Automatic", "Manual"] as Transmission[]).map(
                  (v) => [v, v] as [string, string],
                ),
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Fuel">
            <FilterSelect
              value={search.fuel}
              onChange={(v) => update({ fuel: v })}
              options={[
                ["", "All"],
                ...(
                  ["Petrol", "Diesel", "Hybrid", "Electric"] as FuelType[]
                ).map((v) => [v, v] as [string, string]),
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Condition">
            <FilterSelect
              value={search.condition}
              onChange={(v) => update({ condition: v })}
              options={[
                ["", "All"],
                ...(
                  ["New", "Foreign Used", "Locally Used"] as Condition[]
                ).map((v) => [v, v] as [string, string]),
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Price (KES)">
            <div className="flex gap-2">
              <DebouncedNumberInput
                placeholder="Min"
                value={search.minPrice}
                onChange={(v) => update({ minPrice: v })}
              />
              <DebouncedNumberInput
                placeholder="Max"
                value={search.maxPrice}
                onChange={(v) => update({ maxPrice: v })}
              />
            </div>
          </FilterGroup>

          <FilterGroup label="Year">
            <div className="flex gap-2">
              <DebouncedNumberInput
                placeholder="From"
                value={search.minYear}
                onChange={(v) => update({ minYear: v })}
              />
              <DebouncedNumberInput
                placeholder="To"
                value={search.maxYear}
                onChange={(v) => update({ maxYear: v })}
              />
            </div>
          </FilterGroup>
        </aside>

        <div>
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-lg font-semibold">
                No cars match your filters.
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                Try clearing some filters or a different search term.
              </p>
              <button
                onClick={clearAll}
                className="mt-4 rounded-lg bg-brand-navy px-5 py-2 text-sm font-bold text-white"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((car) => (
                <ListingCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </div>
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

function DebouncedNumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder: string;
}) {
  const [local, setLocal] = useState(String(value ?? ""));

  useEffect(() => {
    setLocal(String(value ?? ""));
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const num = local === "" ? undefined : Number(local);
      onChange(num);
    }, 500);
    return () => clearTimeout(timer);
  }, [local, onChange]);

  return (
    <input
      type="number"
      inputMode="numeric"
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
    />
  );
}
