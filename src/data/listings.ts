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
  isAuction?: boolean;
  auctionEndsAt?: string;
  startingBidKes?: number;
  currentBidKes?: number;
  bidCount?: number;
  highestBidder?: string;
}

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function formatMileage(km: number): string {
  return `${km.toLocaleString("en-KE")} km`;
}