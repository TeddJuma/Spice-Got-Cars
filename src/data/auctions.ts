import carPrado from "@/assets/car-prado.jpg";
import carXtrail from "@/assets/car-xtrail.jpg";
import carCx5 from "@/assets/car-cx5.jpg";
import carForester from "@/assets/car-forester.jpg";
import carHilux from "@/assets/car-hilux.jpg";
import carC200 from "@/assets/car-c200.jpg";
import carDemio from "@/assets/car-demio.jpg";
import carHarrier from "@/assets/car-harrier.jpg";

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

export const auctionItems: AuctionItem[] = [
  {
    id: "AUC-001",
    make: "Toyota",
    model: "Land Cruiser Prado",
    trim: "TX-L",
    year: 2018,
    startingBidKes: 6500000,
    currentBidKes: 7850000,
    negotiable: false,
    mileageKm: 64000,
    transmission: "Automatic",
    fuelType: "Diesel",
    engineSize: "2.8L",
    bodyType: "SUV",
    condition: "Foreign Used",
    photos: [carPrado, carHarrier, carXtrail, carForester, carCx5, carHilux],
    description:
      "Well-maintained Prado TX-L imported from Japan. Full leather, sunroof, cruise control. Fresh service done in-house.",
    status: "active",
    ntsaInspected: true,
    logbookVerified: true,
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    bidCount: 5,
    highestBidder: "John K.",
  },
  {
    id: "AUC-002",
    make: "Nissan",
    model: "X-Trail",
    trim: "T32 20X",
    year: 2016,
    startingBidKes: 1800000,
    currentBidKes: 2400000,
    negotiable: false,
    mileageKm: 92000,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "2.0L",
    bodyType: "SUV",
    condition: "Locally Used",
    photos: [carXtrail, carPrado, carHarrier, carForester, carCx5, carC200],
    description:
      "Clean locally used X-Trail with full service history. 7-seater, panoramic sunroof, alloy rims. One owner from new.",
    status: "active",
    ntsaInspected: true,
    logbookVerified: true,
    endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    bidCount: 3,
    highestBidder: "Mary W.",
  },
  {
    id: "AUC-003",
    make: "Mazda",
    model: "CX-5",
    trim: "2.2 Diesel",
    year: 2017,
    startingBidKes: 2200000,
    currentBidKes: 2950000,
    negotiable: false,
    mileageKm: 78000,
    transmission: "Automatic",
    fuelType: "Diesel",
    engineSize: "2.2L",
    bodyType: "SUV",
    condition: "Foreign Used",
    photos: [carCx5, carXtrail, carHarrier, carForester, carPrado, carHilux],
    description:
      "Reliable Mazda CX-5 with frugal 2.2 diesel. Full leather, heated seats, radar cruise. Serviced and ready.",
    status: "active",
    ntsaInspected: true,
    logbookVerified: true,
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    bidCount: 0,
  },
  {
    id: "AUC-004",
    make: "Subaru",
    model: "Forester",
    trim: "Eyesight",
    year: 2020,
    startingBidKes: 3500000,
    currentBidKes: 4100000,
    negotiable: false,
    mileageKm: 31500,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "2.5L",
    bodyType: "SUV",
    condition: "Foreign Used",
    photos: [carForester, carHarrier, carXtrail, carCx5, carPrado, carC200],
    description:
      "Low-mileage Forester with Eyesight driver assistance. Symmetrical AWD perfect for weekend getaways.",
    status: "active",
    ntsaInspected: true,
    logbookVerified: true,
    endsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    bidCount: 2,
    highestBidder: "Peter M.",
  },
  {
    id: "AUC-005",
    make: "Toyota",
    model: "Hilux",
    trim: "Double Cab 2.4",
    year: 2019,
    startingBidKes: 3800000,
    currentBidKes: 4650000,
    negotiable: false,
    mileageKm: 58000,
    transmission: "Manual",
    fuelType: "Diesel",
    engineSize: "2.4L",
    bodyType: "Pickup",
    condition: "Locally Used",
    photos: [carHilux, carPrado, carXtrail, carForester, carCx5, carHarrier],
    description:
      "Locally assembled Hilux double cab. 4WD, roll bar, hard bed cover. Full logbook available.",
    status: "ended",
    ntsaInspected: true,
    logbookVerified: true,
    endsAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    bidCount: 8,
    highestBidder: "James K.",
  },
  {
    id: "AUC-006",
    make: "Mercedes-Benz",
    model: "C200",
    trim: "Avantgarde",
    year: 2017,
    startingBidKes: 3000000,
    currentBidKes: 3800000,
    negotiable: false,
    mileageKm: 71000,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "2.0L Turbo",
    bodyType: "Saloon",
    condition: "Foreign Used",
    photos: [carC200, carHarrier, carPrado, carCx5, carXtrail, carForester],
    description:
      "Executive C200 in pristine condition. Burmester sound, panoramic roof, ambient lighting.",
    status: "active",
    ntsaInspected: true,
    logbookVerified: true,
    endsAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    bidCount: 4,
    highestBidder: "Sarah N.",
  },
];
