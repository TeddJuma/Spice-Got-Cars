import { Link } from "@tanstack/react-router";
import { Gauge, Calendar, Fuel, Cog, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKes, formatMileage, type Car } from "@/data/listings";
import { buildCarInquiryLink } from "@/lib/whatsapp";

export function ListingCard({ car }: { car: Car }) {
  const isSold = car.status === "sold";
  const isReserved = car.status === "reserved";

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all",
        !isSold && "hover:shadow-xl",
      )}
    >
      <Link
        to="/inventory/$id"
        params={{ id: car.id }}
        className="block"
        aria-label={`View ${car.year} ${car.make} ${car.model}`}
      >
        <div className={cn("relative", isSold && "grayscale")}>
          <img
            src={car.photos[0]}
            alt={`${car.year} ${car.make} ${car.model}`}
            width={1280}
            height={960}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="absolute top-3 left-3 rounded bg-brand-navy/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            {car.condition}
          </div>
          {isSold && (
            <div className="absolute inset-0 flex items-center justify-center bg-brand-navy/40">
              <span className="rotate-[-12deg] rounded-lg border-2 border-brand-navy bg-white px-6 py-2 text-2xl font-black text-brand-navy shadow-2xl">
                SOLD
              </span>
            </div>
          )}
          {isReserved && (
            <div className="absolute top-3 right-3 rounded bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Reserved
            </div>
          )}
        </div>
      </Link>

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link
            to="/inventory/$id"
            params={{ id: car.id }}
            className="min-w-0 flex-1"
          >
            <h3 className="truncate text-lg font-bold text-brand-navy">
              {car.make} {car.model}
            </h3>
          </Link>
          {!isSold && (
            <span className="shrink-0 rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-brand-accent">
              {isReserved ? "Reserved" : "Available"}
            </span>
          )}
        </div>

        <div
          className={cn(
            "mb-4 text-2xl font-black",
            isSold ? "text-brand-muted" : "text-brand-navy",
          )}
        >
          {formatKes(car.priceKes)}{" "}
          {car.negotiable && !isSold && (
            <span className="text-xs font-normal text-brand-muted">Neg.</span>
          )}
        </div>

        <div className="mb-5 grid grid-cols-2 gap-y-2 text-sm text-brand-muted">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" />
            <span>{car.year}</span>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="size-4 shrink-0" />
            <span>{formatMileage(car.mileageKm)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Cog className="size-4 shrink-0" />
            <span>{car.transmission}</span>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="size-4 shrink-0" />
            <span>{car.fuelType}</span>
          </div>
        </div>

        {isSold ? (
          <button
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-slate-200 py-3 text-sm font-bold text-slate-400"
          >
            Sold - Out of Stock
          </button>
        ) : (
          <div className="flex gap-2">
            <Link
              to="/inventory/$id"
              params={{ id: car.id }}
              className="flex-1 rounded-lg bg-brand-navy py-3 text-center text-sm font-bold text-white transition-colors hover:bg-slate-800"
            >
              View Details
            </Link>
            <a
              href={buildCarInquiryLink(car)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Ask about ${car.year} ${car.make} ${car.model} on WhatsApp`}
              className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-accent text-white transition-transform hover:scale-105 active:scale-95"
            >
              <MessageCircle className="size-5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}