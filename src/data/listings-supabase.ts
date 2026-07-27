import { createServerClient } from "../lib/supabase-server";
import { listings as fallbackListings, type Car } from "./listings";

export async function fetchListings(): Promise<Car[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("listed_at", { ascending: false });

    if (error || !data) {
      console.error("Supabase fetch error:", error);
      return fallbackListings;
    }

    const cars: Car[] = await Promise.all(
      data.map(async (row) => {
        const { data: photos } = await supabase
          .from("listing_photos")
          .select("storage_path")
          .eq("listing_id", row.id)
          .order("sort_order", { ascending: true });

        return {
          id: row.id,
          make: row.make,
          model: row.model,
          trim: row.trim || undefined,
          year: row.year,
          priceKes: row.price_kes,
          negotiable: row.negotiable,
          mileageKm: row.mileage_km,
          transmission: row.transmission as Car["transmission"],
          fuelType: row.fuel_type as Car["fuelType"],
          engineSize: row.engine_size,
          bodyType: row.body_type as Car["bodyType"],
          condition: row.condition as Car["condition"],
          photos: photos?.map((p) => p.storage_path) || [],
          description: row.description,
          status: row.status as Car["status"],
          ntsaInspected: row.ntsa_inspected,
          logbookVerified: row.logbook_verified,
          listedAt: row.listed_at,
        };
      })
    );

    return cars.length > 0 ? cars : fallbackListings;
  } catch (err) {
    console.error("Failed to fetch listings from Supabase:", err);
    return fallbackListings;
  }
}

export async function fetchListingById(id: string): Promise<Car | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    const { data: photos } = await supabase
      .from("listing_photos")
      .select("storage_path")
      .eq("listing_id", id)
      .order("sort_order", { ascending: true });

    return {
      id: data.id,
      make: data.make,
      model: data.model,
      trim: data.trim || undefined,
      year: data.year,
      priceKes: data.price_kes,
      negotiable: data.negotiable,
      mileageKm: data.mileage_km,
      transmission: data.transmission as Car["transmission"],
      fuelType: data.fuel_type as Car["fuelType"],
      engineSize: data.engine_size,
      bodyType: data.body_type as Car["bodyType"],
      condition: data.condition as Car["condition"],
      photos: photos?.map((p) => p.storage_path) || [],
      description: data.description,
      status: data.status as Car["status"],
      ntsaInspected: data.ntsa_inspected,
      logbookVerified: data.logbook_verified,
      listedAt: data.listed_at,
      isAuction: data.is_auction,
      auctionEndsAt: data.auction_ends_at,
      startingBidKes: data.starting_bid_kes,
      currentBidKes: data.current_bid_kes,
      bidCount: data.bid_count,
      highestBidder: data.highest_bidder,
    };
  } catch (err) {
    console.error("Failed to fetch listing from Supabase:", err);
    return null;
  }
}
