export type Transmission = "Automatic" | "Manual";
export type FuelType = "Petrol" | "Diesel" | "Hybrid" | "Electric";
export type BodyType =
  | "SUV"
  | "Saloon"
  | "Hatchback"
  | "Pickup"
  | "Wagon"
  | "Coupe";
export type Condition = "New" | "Foreign Used" | "Locally Used";
export type Status = "available" | "reserved" | "sold";

export interface Car {
  id: string;
  make: string;
  model: string;
  trim?: string;
  year: number;
  priceKes: number;
  negotiable: boolean;
  mileageKm: number;
  transmission: Transmission;
  fuelType: FuelType;
  engineSize: string;
  bodyType: BodyType;
  condition: Condition;
  photos: string[];
  description: string;
  status: Status;
  ntsaInspected: boolean;
  logbookVerified: boolean;
  listedAt: string; // ISO date
  location?: string;
  locationPin?: string;
  isAuction?: boolean;
  auctionEndsAt?: string;
  startingBidKes?: number;
  currentBidKes?: number;
  bidCount?: number;
  highestBidder?: string;
  auctionWindows?: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
  }>;
}

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function formatMileage(km: number): string {
  return `${km.toLocaleString("en-KE")} km`;
}

export function getAuctionStatus(car: Car): { label: string; color: string; description: string } {
  if (!car.isAuction || !car.auctionWindows || car.auctionWindows.length === 0) {
    if (car.status === "sold") {
      return { label: "Sold", color: "bg-slate-500", description: "This auction has ended." };
    }
    if (car.status === "reserved") {
      return { label: "Reserved", color: "bg-amber-500", description: "This auction has ended." };
    }
    return { label: "Active", color: "bg-emerald-500", description: "Bidding is open." };
  }

  const now = new Date();
  const sortedWindows = [...car.auctionWindows].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const activeWindow = sortedWindows.find(w => {
    const start = new Date(w.startsAt);
    const end = new Date(w.endsAt);
    return now >= start && now < end;
  });

  if (activeWindow) {
    return { label: "Live now", color: "bg-emerald-500", description: "Bidding is open right now." };
  }

  const nextWindow = sortedWindows.find(w => new Date(w.startsAt) > now);
  if (nextWindow) {
    const start = new Date(nextWindow.startsAt);
    return {
      label: "Paused",
      color: "bg-amber-500",
      description: `Bidding resumes ${start.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}`,
    };
  }

  return { label: "Ended", color: "bg-slate-500", description: "All auction windows have passed." };
}