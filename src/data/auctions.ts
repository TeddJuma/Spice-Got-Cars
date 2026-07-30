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
}
