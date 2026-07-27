import carPrado from "@/assets/car-prado.jpg";
import carXtrail from "@/assets/car-xtrail.jpg";
import carCx5 from "@/assets/car-cx5.jpg";
import carForester from "@/assets/car-forester.jpg";
import carHilux from "@/assets/car-hilux.jpg";
import carC200 from "@/assets/car-c200.jpg";
import carDemio from "@/assets/car-demio.jpg";
import carHarrier from "@/assets/car-harrier.jpg";

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

export const listings: Car[] = [
  {
    id: "MA-2401",
    make: "Toyota",
    model: "Land Cruiser Prado",
    trim: "TX-L",
    year: 2018,
    priceKes: 7850000,
    negotiable: true,
    mileageKm: 64000,
    transmission: "Automatic",
    fuelType: "Diesel",
    engineSize: "2.8L",
    bodyType: "SUV",
    condition: "Foreign Used",
    photos: [carPrado, carHarrier, carXtrail, carForester, carCx5, carHilux],
    description:
      "A well-maintained Prado TX-L imported from Japan. Full leather interior, sunroof, cruise control, and reverse camera. Fresh service done in-house. Ready for Nairobi and upcountry roads.",
    status: "available",
    ntsaInspected: true,
    logbookVerified: true,
    listedAt: "2026-06-18",
  },
  {
    id: "MA-2402",
    make: "Nissan",
    model: "X-Trail",
    trim: "T32 20X",
    year: 2016,
    priceKes: 2400000,
    negotiable: true,
    mileageKm: 92000,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "2.0L",
    bodyType: "SUV",
    condition: "Locally Used",
    photos: [carXtrail, carPrado, carHarrier, carForester, carCx5, carC200],
    description:
      "Clean locally used X-Trail with full service history at Nissan Kenya. 7-seater configuration, panoramic sunroof, alloy rims. One owner from new.",
    status: "available",
    ntsaInspected: true,
    logbookVerified: true,
    listedAt: "2026-06-22",
  },
  {
    id: "MA-2403",
    make: "Mazda",
    model: "CX-5",
    trim: "2.2 Diesel",
    year: 2017,
    priceKes: 2950000,
    negotiable: false,
    mileageKm: 78000,
    transmission: "Automatic",
    fuelType: "Diesel",
    engineSize: "2.2L",
    bodyType: "SUV",
    condition: "Foreign Used",
    photos: [carCx5, carXtrail, carHarrier, carForester, carPrado, carC200],
    description:
      "Reliable Mazda CX-5 with the frugal 2.2 diesel. Full leather, heated seats, radar cruise. Serviced and ready to drive away.",
    status: "sold",
    ntsaInspected: true,
    logbookVerified: true,
    listedAt: "2026-05-30",
  },
  {
    id: "MA-2404",
    make: "Subaru",
    model: "Forester",
    trim: "Eyesight",
    year: 2020,
    priceKes: 4100000,
    negotiable: true,
    mileageKm: 31500,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "2.5L",
    bodyType: "SUV",
    condition: "Foreign Used",
    photos: [carForester, carHarrier, carXtrail, carCx5, carPrado, carHilux],
    description:
      "Low-mileage Forester with Subaru's Eyesight driver assistance. Symmetrical AWD makes it perfect for weekend getaways and rough country roads.",
    status: "available",
    ntsaInspected: true,
    logbookVerified: true,
    listedAt: "2026-06-27",
  },
  {
    id: "MA-2405",
    make: "Toyota",
    model: "Hilux",
    trim: "Double Cab 2.4",
    year: 2019,
    priceKes: 4650000,
    negotiable: true,
    mileageKm: 58000,
    transmission: "Manual",
    fuelType: "Diesel",
    engineSize: "2.4L",
    bodyType: "Pickup",
    condition: "Locally Used",
    photos: [carHilux, carPrado, carXtrail, carForester, carCx5, carHarrier],
    description:
      "Locally assembled Hilux double cab. 4WD, roll bar, hard bed cover. Ideal for farm work or long-distance travel. Full logbook available.",
    status: "available",
    ntsaInspected: true,
    logbookVerified: true,
    listedAt: "2026-06-10",
  },
  {
    id: "MA-2406",
    make: "Mercedes-Benz",
    model: "C200",
    trim: "Avantgarde",
    year: 2017,
    priceKes: 3800000,
    negotiable: true,
    mileageKm: 71000,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "2.0L Turbo",
    bodyType: "Saloon",
    condition: "Foreign Used",
    photos: [carC200, carHarrier, carPrado, carCx5, carXtrail, carForester],
    description:
      "Executive C200 in pristine condition. Burmester sound system, panoramic roof, ambient lighting. Perfect city saloon.",
    status: "reserved",
    ntsaInspected: true,
    logbookVerified: true,
    listedAt: "2026-06-15",
  },
  {
    id: "MA-2407",
    make: "Mazda",
    model: "Demio",
    trim: "13S",
    year: 2016,
    priceKes: 1150000,
    negotiable: true,
    mileageKm: 88000,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "1.3L",
    bodyType: "Hatchback",
    condition: "Foreign Used",
    photos: [carDemio, carCx5, carXtrail, carHarrier, carForester, carC200],
    description:
      "Fuel-efficient Demio, perfect first car or run-around town. Push-start, alloy rims, keyless entry.",
    status: "available",
    ntsaInspected: true,
    logbookVerified: true,
    listedAt: "2026-06-25",
  },
  {
    id: "MA-2408",
    make: "Toyota",
    model: "Harrier",
    trim: "Premium",
    year: 2019,
    priceKes: 5600000,
    negotiable: true,
    mileageKm: 44000,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "2.0L",
    bodyType: "SUV",
    condition: "Foreign Used",
    photos: [carHarrier, carPrado, carXtrail, carForester, carCx5, carC200],
    description:
      "Premium Harrier with JBL sound, half leather, and 360-degree camera. Fresh import, ready for logbook transfer.",
    status: "available",
    ntsaInspected: true,
    logbookVerified: true,
    listedAt: "2026-06-29",
  },
  {
    id: "MA-2409",
    make: "Toyota",
    model: "Corolla",
    trim: "Fielder Hybrid",
    year: 2017,
    priceKes: 1750000,
    negotiable: true,
    mileageKm: 96000,
    transmission: "Automatic",
    fuelType: "Hybrid",
    engineSize: "1.5L",
    bodyType: "Wagon",
    condition: "Foreign Used",
    photos: [carDemio, carCx5, carC200, carXtrail, carHarrier, carForester],
    description:
      "Frugal hybrid wagon, an all-day workhorse. Excellent for Uber, family duty, or upcountry travel.",
    status: "available",
    ntsaInspected: true,
    logbookVerified: true,
    listedAt: "2026-06-05",
  },
  {
    id: "MA-2410",
    make: "Nissan",
    model: "Navara",
    trim: "NP300",
    year: 2018,
    priceKes: 4200000,
    negotiable: true,
    mileageKm: 68000,
    transmission: "Automatic",
    fuelType: "Diesel",
    engineSize: "2.5L",
    bodyType: "Pickup",
    condition: "Foreign Used",
    photos: [carHilux, carPrado, carXtrail, carC200, carForester, carHarrier],
    description:
      "Premium Navara double cab. Leather, reverse camera, and 4WD. Great alternative to Hilux with lower price point.",
    status: "available",
    ntsaInspected: true,
    logbookVerified: true,
    listedAt: "2026-06-12",
  },
];

export function getCarById(id: string): Car | undefined {
  return listings.find((c) => c.id === id);
}

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function formatMileage(km: number): string {
  return `${km.toLocaleString("en-KE")} km`;
}