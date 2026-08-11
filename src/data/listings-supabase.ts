import { createServerClient } from "../lib/supabase-server";
import { type Car } from "./listings";

export async function fetchFilterOptions() {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return { makes: [], models: [], locations: [] };
    }

    const { data, error } = await supabase
      .from("listings")
      .select("make, model, location");

    if (error || !data) {
      return { makes: [], models: [], locations: [] };
    }

    const makes = [...new Set(data.map((l: any) => l.make).filter(Boolean))].sort();
    const models = [...new Set(data.map((l: any) => l.model).filter(Boolean))].sort();
    const locations = [...new Set(data.map((l: any) => l.location).filter(Boolean))].sort();

    return { makes, models, locations };
  } catch (err) {
    console.error("Failed to fetch filter options:", err);
    return { makes: [], models: [], locations: [] };
  }
}

export async function fetchListings(includeAuctions = true): Promise<Car[]> {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      console.warn("Supabase is not configured");
      return [];
    }

    const query = supabase
      .from("listings")
      .select("*")
      .order("listed_at", { ascending: false });

    if (!includeAuctions) {
      query.eq("is_auction", false);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error("Supabase fetch error:", error);
      return [];
    }

    const cars: Car[] = await Promise.all(
      data.map(async (row) => {
        const { data: photos } = await supabase
          .from("listing_photos")
          .select("storage_path")
          .eq("listing_id", row.id)
          .order("sort_order", { ascending: true });

        const { data: windows } = await supabase
          .from("auction_windows")
          .select("id, starts_at, ends_at")
          .eq("listing_id", row.id)
          .order("starts_at", { ascending: true });

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
          location: row.location || undefined,
          locationPin: row.location_pin || undefined,
          isAuction: row.is_auction,
          auctionEndsAt: row.auction_ends_at,
          startingBidKes: row.starting_bid_kes,
          currentBidKes: row.current_bid_kes,
          bidCount: row.bid_count,
          highestBidder: row.highest_bidder,
          auctionWindows: windows?.map((w) => ({
            id: w.id,
            startsAt: w.starts_at,
            endsAt: w.ends_at,
          })) || [],
        };
      }),
    );

    return cars;
  } catch (err) {
    console.error("Failed to fetch listings from Supabase:", err);
    return [];
  }
}

export async function fetchListingById(id: string): Promise<Car | null> {
  try {
    const supabase = createServerClient();
    if (!supabase) return null;

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

    const { data: windows } = await supabase
      .from("auction_windows")
      .select("id, starts_at, ends_at")
      .eq("listing_id", id)
      .order("starts_at", { ascending: true });

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
      location: data.location || undefined,
      locationPin: data.location_pin || undefined,
      isAuction: data.is_auction,
      auctionEndsAt: data.auction_ends_at,
      startingBidKes: data.starting_bid_kes,
      currentBidKes: data.current_bid_kes,
      bidCount: data.bid_count,
      highestBidder: data.highest_bidder,
      auctionWindows: windows?.map((w) => ({
        id: w.id,
        startsAt: w.starts_at,
        endsAt: w.ends_at,
      })) || [],
    };
  } catch (err) {
    console.error("Failed to fetch listing from Supabase:", err);
    return null;
  }
}
