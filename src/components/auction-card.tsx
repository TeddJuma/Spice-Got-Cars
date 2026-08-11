import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Gauge, Calendar, Fuel, Cog, MessageCircle, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKes, formatMileage, getAuctionStatus, type Car } from "@/data/listings";
import { buildCarInquiryLink } from "@/lib/whatsapp";

export interface AuctionItem {
  id: string;
  make: string;
  model: string;
  trim?: string;
  year: number;
  startingBidKes: number;
  currentBidKes: number;
  negotiable: boolean;
  mileageKm: number;
  transmission: string;
  fuelType: string;
  engineSize: string;
  bodyType: string;
  condition: string;
  photos: string[];
  description: string;
  status: "active" | "ended" | "sold";
  ntsaInspected: boolean;
  logbookVerified: boolean;
  endsAt: string;
  bidCount: number;
  highestBidder?: string;
  location?: string;
  locationPin?: string;
  auctionWindows?: Array<{ id: string; startsAt: string; endsAt: string }>;
}

export function AuctionCard({ item }: { item: AuctionItem }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [currentStatus, setCurrentStatus] = useState(getAuctionStatus({
    ...item,
    isAuction: true,
    auctionWindows: item.auctionWindows,
  }));

  useEffect(() => {
    const tick = () => {
      setCurrentStatus(getAuctionStatus({
        ...item,
        isAuction: true,
        auctionWindows: item.auctionWindows,
      }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [item]);

  useEffect(() => {
    if (currentStatus.label !== "Live now") {
      setTimeLeft("");
      return;
    }
    const tick = () => {
      const now = new Date();
      const activeWindow = item.auctionWindows?.find(w => {
        const start = new Date(w.startsAt);
        const end = new Date(w.endsAt);
        return now >= start && now < end;
      });
      if (!activeWindow) {
        setTimeLeft("");
        return;
      }
      const end = new Date(activeWindow.endsAt);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("Ending...");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [currentStatus.label, item.auctionWindows]);

  const isEnded = currentStatus.label === "Ended" || item.status === "sold";
  const statusColor = currentStatus.color.replace("bg-", "text-").replace("bg-", "bg-");
  const statusBg = currentStatus.color;

  const photo = item.photos[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' fill='%23e2e8f0'%3E%3Crect width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='24'%3ENo Photo%3C/text%3E%3C/svg%3E";

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl">
      <Link
        to="/inventory/$id"
        params={{ id: item.id }}
        className="block"
        aria-label={`View ${item.year} ${item.make} ${item.model}`}
      >
        <div className="relative">
          <img
            src={photo}
            alt={`${item.year} ${item.make} ${item.model}`}
            width={1280}
            height={960}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="absolute top-3 left-3 rounded bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Auction
          </div>
          {isEnded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rotate-[-12deg] rounded-lg border-2 border-white bg-white px-6 py-2 text-2xl font-black text-brand-navy shadow-2xl">
                ENDED
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link
            to="/inventory/$id"
            params={{ id: item.id }}
            className="min-w-0 flex-1"
          >
            <h3 className="truncate text-lg font-bold text-brand-navy">
              {item.make} {item.model}
            </h3>
          </Link>
          <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase ${statusBg} text-white`}>
            {currentStatus.label}
          </span>
        </div>

        <div className="mb-3 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-muted">
            <Timer className="size-4 text-brand-accent" />
            <span>{currentStatus.label === "Live now" ? "Time left" : currentStatus.label === "Paused" ? "Status" : "Status"}</span>
          </div>
          {currentStatus.label === "Live now" && timeLeft && (
            <div className="mt-1 text-xl font-black text-brand-navy">
              {timeLeft}
            </div>
          )}
          {currentStatus.label !== "Live now" && (
            <div className={`mt-1 text-lg font-black ${currentStatus.label === "Ended" ? "text-slate-500" : "text-amber-700"}`}>
              {currentStatus.label === "Paused" ? "Paused" : "Ended"}
            </div>
          )}
          <div className="mt-1 text-xs text-brand-muted">
            {item.bidCount > 0 ? (
              <>
                Highest bid —{" "}
                <span className="font-semibold text-brand-navy">
                  {item.highestBidder ?? "Anonymous"}
                </span>{" "}
                ({item.bidCount} {item.bidCount === 1 ? "bid" : "bids"})
              </>
            ) : (
              <span>0 bids</span>
            )}
          </div>
          <div className="mt-2 text-lg font-black text-brand-navy">
            {formatKes(item.currentBidKes)}{" "}
            {item.negotiable && !isEnded && (
              <span className="text-xs font-normal text-brand-muted">
                Starting bid: {formatKes(item.startingBidKes)}
              </span>
            )}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-y-2 text-sm text-brand-muted">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" />
            <span>{item.year}</span>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="size-4 shrink-0" />
            <span>{formatMileage(item.mileageKm)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Cog className="size-4 shrink-0" />
            <span>{item.transmission}</span>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="size-4 shrink-0" />
            <span>{item.fuelType}</span>
          </div>
        </div>

        <Link
          to="/inventory/$id"
          params={{ id: item.id }}
          className="flex w-full items-center justify-center rounded-lg bg-brand-navy py-3 text-center text-sm font-bold text-white transition-colors hover:bg-slate-800"
        >
          View this car
        </Link>
      </div>
    </div>
  );
}
