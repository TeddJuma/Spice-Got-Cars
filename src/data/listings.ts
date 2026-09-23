export type Transmission = "Automatic" | "Manual";
export type FuelType = "Petrol" | "Diesel" | "Hybrid" | "Electric";
export type BodyType = "SUV" | "Saloon" | "Hatchback" | "Pickup" | "Wagon" | "Coupe";
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
  listedAt: string;
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
  agentName?: string;
  agentPhone?: string;
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
  const sortedWindows = [...car.auctionWindows].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  const activeWindow = sortedWindows.find((w) => {
    const start = new Date(w.startsAt);
    const end = new Date(w.endsAt);
    return now >= start && now < end;
  });

  if (activeWindow) {
    return {
      label: "Live now",
      color: "bg-emerald-500",
      description: "Bidding is open right now.",
    };
  }

  const nextWindow = sortedWindows.find((w) => new Date(w.startsAt) > now);
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

export const SAMPLE_CARS: Car[] = [
  {
    id: "prado-tx-2018",
    make: "Toyota",
    model: "Land Cruiser Prado",
    trim: "TX L-Package",
    year: 2018,
    priceKes: 5650000,
    negotiable: true,
    mileageKm: 68000,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "2700cc",
    bodyType: "SUV",
    condition: "Foreign Used",
    photos: ["/cars/car-prado.jpg"],
    description:
      "Mint condition 2018 Toyota Land Cruiser Prado TX. Features sunroof, 7-seater black leather interior, reverse camera, multi-terrain select, push-button start, and logbook verified. Fresh import from Japan, ready for delivery.",
    status: "available",
    listedAt: "2026-03-01T10:00:00Z",
    location: "Kahawa West, Nairobi",
    locationPin: "Kamiti Road, Nairobi",
    agentName: "Spice Sales Team",
    agentPhone: "+254790555421",
  },
  {
    id: "harrier-elegance-2017",
    make: "Toyota",
    model: "Harrier",
    trim: "Elegance",
    year: 2017,
    priceKes: 3450000,
    negotiable: true,
    mileageKm: 74000,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "2000cc",
    bodyType: "SUV",
    condition: "Foreign Used",
    photos: ["/cars/car-harrier.jpg"],
    description:
      "Pristine Toyota Harrier Elegance with panoramic glass roof, premium sound system, half-leather interior, lane departure alert, adaptive cruise control, and daytime running LEDs. Duty fully cleared.",
    status: "available",
    listedAt: "2026-03-05T12:00:00Z",
    location: "Kahawa West, Nairobi",
    locationPin: "Kamiti Road, Nairobi",
    agentName: "Spice Sales Team",
    agentPhone: "+254790555421",
  },
  {
    id: "hilux-revo-2020",
    make: "Toyota",
    model: "Hilux",
    trim: "Double Cabin 2.8 GD-6",
    year: 2020,
    priceKes: 4850000,
    negotiable: false,
    mileageKm: 52000,
    transmission: "Automatic",
    fuelType: "Diesel",
    engineSize: "2800cc",
    bodyType: "Pickup",
    condition: "Foreign Used",
    photos: ["/cars/car-hilux.jpg"],
    description:
      "Heavy-duty Toyota Hilux Revo Double Cabin with selectable 4WD, rear canopy, heavy duty side steps, touchscreen with Apple CarPlay/Android Auto, rear diff lock, and robust suspension.",
    status: "available",
    listedAt: "2026-03-08T09:00:00Z",
    location: "Kahawa West, Nairobi",
    locationPin: "Kamiti Road, Nairobi",
    agentName: "Spice Sales Team",
    agentPhone: "+254790555421",
  },
  {
    id: "cx5-xd-2018",
    make: "Mazda",
    model: "CX-5",
    trim: "XD L-Package 4WD",
    year: 2018,
    priceKes: 2950000,
    negotiable: true,
    mileageKm: 61000,
    transmission: "Automatic",
    fuelType: "Diesel",
    engineSize: "2200cc",
    bodyType: "SUV",
    condition: "Foreign Used",
    photos: ["/cars/car-cx5.jpg"],
    description:
      "Sleek Soul Red Crystal Mazda CX-5 XD. SkyActiv-D twin turbo diesel, Bose surround audio, heated leather memory seats, heads-up display, blind-spot monitoring, 360-degree camera.",
    status: "available",
    listedAt: "2026-03-10T14:30:00Z",
    location: "Kahawa West, Nairobi",
    locationPin: "Kamiti Road, Nairobi",
    isAuction: true,
    startingBidKes: 2600000,
    currentBidKes: 2850000,
    bidCount: 7,
    highestBidder: "Kipchumba K.",
    auctionEndsAt: "2026-03-25T18:00:00Z",
    auctionWindows: [
      {
        id: "w-cx5",
        startsAt: "2026-03-10T08:00:00Z",
        endsAt: "2026-03-25T18:00:00Z",
      },
    ],
    agentName: "Spice Auctions",
    agentPhone: "+254790555421",
  },
  {
    id: "c200-amg-2017",
    make: "Mercedes-Benz",
    model: "C-Class",
    trim: "C200 AMG Line",
    year: 2017,
    priceKes: 3850000,
    negotiable: true,
    mileageKm: 59000,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "2000cc",
    bodyType: "Saloon",
    condition: "Foreign Used",
    photos: ["/cars/car-c200.jpg"],
    description:
      "Executive Mercedes-Benz C200 AMG Line in Obsidian Black. Complete AMG aerodynamic package, panoramic sunroof, ambient cabin lighting, Burmester sound, agility select suspension.",
    status: "available",
    listedAt: "2026-03-11T11:00:00Z",
    location: "Kahawa West, Nairobi",
    locationPin: "Kamiti Road, Nairobi",
    agentName: "Spice Sales Team",
    agentPhone: "+254790555421",
  },
  {
    id: "forester-xt-2016",
    make: "Subaru",
    model: "Forester",
    trim: "2.0XT Turbo AWD",
    year: 2016,
    priceKes: 2750000,
    negotiable: true,
    mileageKm: 83000,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "2000cc",
    bodyType: "SUV",
    condition: "Locally Used",
    photos: ["/cars/car-forester.jpg"],
    description:
      "Subaru Forester 2.0XT Turbo with Symmetrical AWD, X-Mode rough road assist, steering paddle shifters, panoramic moonroof, and premium Harman Kardon sound. Clean 1-owner locally used vehicle with complete history.",
    status: "available",
    listedAt: "2026-03-12T08:00:00Z",
    location: "Kahawa West, Nairobi",
    locationPin: "Kamiti Road, Nairobi",
    isAuction: true,
    startingBidKes: 2300000,
    currentBidKes: 2550000,
    bidCount: 11,
    highestBidder: "Mwangi N.",
    auctionEndsAt: "2026-03-28T16:00:00Z",
    auctionWindows: [
      {
        id: "w-forester",
        startsAt: "2026-03-12T08:00:00Z",
        endsAt: "2026-03-28T16:00:00Z",
      },
    ],
    agentName: "Spice Auctions",
    agentPhone: "+254790555421",
  },
  {
    id: "xtrail-20x-2017",
    make: "Nissan",
    model: "X-Trail",
    trim: "20X Emergency Brake",
    year: 2017,
    priceKes: 2350000,
    negotiable: true,
    mileageKm: 76000,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "2000cc",
    bodyType: "SUV",
    condition: "Foreign Used",
    photos: ["/cars/car-xtrail.jpg"],
    description:
      "Spacious Nissan X-Trail 20X equipped with intelligent 4x4-i system, heated seats, power tailgate, emergency brake package, 360 around-view monitor, factory roof rails.",
    status: "available",
    listedAt: "2026-03-13T16:00:00Z",
    location: "Kahawa West, Nairobi",
    locationPin: "Kamiti Road, Nairobi",
    agentName: "Spice Sales Team",
    agentPhone: "+254790555421",
  },
  {
    id: "demio-skyactiv-2018",
    make: "Mazda",
    model: "Demio",
    trim: "13S SkyActiv",
    year: 2018,
    priceKes: 1450000,
    negotiable: true,
    mileageKm: 48000,
    transmission: "Automatic",
    fuelType: "Petrol",
    engineSize: "1300cc",
    bodyType: "Hatchback",
    condition: "Foreign Used",
    photos: ["/cars/car-demio.jpg"],
    description:
      "Remarkably fuel-efficient Mazda Demio SkyActiv (delivering over 20km/L in Nairobi traffic). Equipped with i-Stop, reverse camera, lane departure alert, digital climate control, push start.",
    status: "available",
    listedAt: "2026-03-14T10:00:00Z",
    location: "Kahawa West, Nairobi",
    locationPin: "Kamiti Road, Nairobi",
    agentName: "Spice Sales Team",
    agentPhone: "+254790555421",
  },
];
