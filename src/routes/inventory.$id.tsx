import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Car as CarIcon,
  ShieldCheck,
  FileCheck,
  Phone,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import { getCarById, formatKes, formatMileage } from "@/data/listings";
import { fetchListingById } from "@/data/listings-supabase";
import { buildCarInquiryLink, PHONE_TEL, WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory/$id")({
  loader: async ({ params }) => {
    const car = await fetchListingById(params.id);
    if (!car) {
      const localCar = getCarById(params.id);
      if (!localCar) throw notFound();
      return { car: localCar };
    }
    return { car };
  },
  head: ({ loaderData }) => {
    const car = loaderData?.car;
    if (!car) {
      return { meta: [{ title: "Listing not found - Spice Got Cars" }] };
    }
    const title = `${car.year} ${car.make} ${car.model} - ${formatKes(car.priceKes)} | Spice Got Cars`;
    const desc = `${car.condition}. ${formatMileage(car.mileageKm)}, ${car.transmission}, ${car.fuelType}. Listed in Ruaka by Spice Got Cars.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: car.photos[0] },
        { name: "twitter:image", content: car.photos[0] },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Listing not found</h1>
      <p className="mt-2 text-brand-muted">
        This car may have been sold or removed.
      </p>
      <Link
        to="/inventory"
        className="mt-6 inline-block rounded-lg bg-brand-navy px-5 py-2 text-sm font-bold text-white"
      >
        Back to inventory
      </Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    console.error(error);
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-brand-navy px-5 py-2 text-sm font-bold text-white"
        >
          Try again
        </button>
      </div>
    );
  },
  component: CarDetailPage,
});

function CarDetailPage() {
  const { car } = Route.useLoaderData();
  const [activePhoto, setActivePhoto] = useState(0);
  const isSold = car.status === "sold";
  const isReserved = car.status === "reserved";

  const specs: [string, string][] = [
    ["Year", String(car.year)],
    ["Mileage", formatMileage(car.mileageKm)],
    ["Transmission", car.transmission],
    ["Fuel", car.fuelType],
    ["Engine", car.engineSize],
    ["Body type", car.bodyType],
    ["Condition", car.condition],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <Link
        to="/inventory"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-brand-navy"
      >
        <ArrowLeft className="size-4" />
        Back to inventory
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Gallery */}
        <div>
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-slate-200 bg-white",
              isSold && "grayscale",
            )}
          >
            <img
              src={car.photos[activePhoto]}
              alt={`${car.year} ${car.make} ${car.model}`}
              width={1280}
              height={960}
              className="aspect-[4/3] w-full object-cover"
            />
            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center bg-brand-navy/40">
                <span className="rotate-[-8deg] rounded-lg border-2 border-brand-navy bg-white px-8 py-3 text-4xl font-black text-brand-navy shadow-2xl">
                  SOLD
                </span>
              </div>
            )}
            {isReserved && (
              <div className="absolute top-4 right-4 rounded bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Reserved
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-6 gap-2">
            {car.photos.map((src: string, i: number) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={cn(
                  "overflow-hidden rounded-md border-2 transition-all",
                  activePhoto === i
                    ? "border-brand-accent"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
                aria-label={`Show photo ${i + 1}`}
              >
                <img
                  src={src}
                  alt=""
                  width={200}
                  height={150}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Description & specs */}
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="mb-3 text-xl font-bold">Description</h2>
              <p className="leading-relaxed text-slate-700">
                {car.description}
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold">Specifications</h2>
              <dl className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-2">
                {specs.map(([k, v], i) => (
                  <div
                    key={k}
                    className={cn(
                      "flex justify-between gap-4 border-slate-100 px-5 py-3 text-sm",
                      i < specs.length - (specs.length % 2 === 0 ? 2 : 1)
                        ? "border-b"
                        : "sm:border-b-0",
                    )}
                  >
                    <dt className="text-brand-muted">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold">
                Trust & documentation
              </h2>
              <ul className="space-y-2 text-sm">
                <TrustLine
                  ok={car.logbookVerified}
                  label="Logbook and ownership verified in-house"
                />
                <TrustLine
                  ok={car.ntsaInspected}
                  label="NTSA inspection completed"
                />
                <TrustLine
                  ok
                  label="Logbook transfer supported by Spice Got Cars team"
                />
              </ul>
            </section>
          </div>
        </div>

        {/* Sticky sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-muted">
              {car.condition}
            </div>
            <h1 className="text-2xl font-bold leading-tight text-brand-navy">
              {car.year} {car.make} {car.model}
              {car.trim && (
                <span className="text-brand-muted"> {car.trim}</span>
              )}
            </h1>

            <div
              className={cn(
                "mt-4 mb-6 text-3xl font-black",
                isSold ? "text-brand-muted" : "text-brand-navy",
              )}
            >
              {formatKes(car.priceKes)}{" "}
              {car.negotiable && !isSold && (
                <span className="text-sm font-normal text-brand-muted">
                  Negotiable
                </span>
              )}
            </div>

            <div className="mb-6 grid grid-cols-2 gap-y-3 text-sm text-brand-muted">
              <QuickSpec icon={<Calendar className="size-4" />} label={String(car.year)} />
              <QuickSpec icon={<Gauge className="size-4" />} label={formatMileage(car.mileageKm)} />
              <QuickSpec icon={<Cog className="size-4" />} label={car.transmission} />
              <QuickSpec icon={<Fuel className="size-4" />} label={car.fuelType} />
              <QuickSpec icon={<CarIcon className="size-4" />} label={car.bodyType} />
              <QuickSpec icon={<ShieldCheck className="size-4" />} label="NTSA OK" />
            </div>

            {isSold ? (
              <div className="rounded-lg bg-slate-100 p-4 text-center text-sm font-semibold text-brand-muted">
                This car has been sold. Browse similar vehicles in our{" "}
                <Link to="/inventory" className="text-brand-accent underline">
                  inventory
                </Link>
                .
              </div>
            ) : (
              <div className="space-y-2">
                <a
                  href={buildCarInquiryLink(car)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <MessageCircle className="size-5" />
                  WhatsApp about this car
                </a>
                <a
                  href={`tel:${PHONE_TEL}`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-brand-navy py-3 font-bold text-white transition-colors hover:bg-slate-800"
                >
                  <Phone className="size-5" />
                  Call {WHATSAPP_DISPLAY}
                </a>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function QuickSpec({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function TrustLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2">
      <FileCheck
        className={cn(
          "mt-0.5 size-4 shrink-0",
          ok ? "text-brand-accent" : "text-slate-300",
        )}
      />
      <span className={ok ? "text-slate-700" : "text-brand-muted"}>{label}</span>
    </li>
  );
}