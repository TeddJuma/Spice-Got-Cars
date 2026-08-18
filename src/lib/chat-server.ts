import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient } from "./supabase-server";
import type { Car } from "./listings";

const SITE_BASE_URL = "https://spicegotcars.co.ke";

async function fetchRecentListings(): Promise<Car[]> {
  try {
    const supabase = createServerClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "available")
      .order("listed_at", { ascending: false })
      .limit(10);

    if (error || !data) return [];

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
          isAuction: row.is_auction,
          auctionEndsAt: row.auction_ends_at,
          startingBidKes: row.starting_bid_kes,
          currentBidKes: row.current_bid_kes,
          bidCount: row.bid_count,
          highestBidder: row.highest_bidder,
        };
      }),
    );

    return cars;
  } catch (err) {
    console.error("Failed to fetch listings for chat:", err);
    return [];
  }
}

function buildSystemPrompt(listings: Car[]): string {
  const listingsText = listings
    .map(
      (car) =>
        `- ${car.year} ${car.make} ${car.model} ${car.trim ?? ""} — KES ${car.priceKes.toLocaleString()} (${car.condition})${car.location ? ` — ${car.location}` : ""}`,
    )
    .join("\n");

  return `You are the built-in assistant for the Spice Got Cars website. You are already inside the site, so do not tell users to visit spicegotcars.co.ke or "our website" — you are speaking from within it.

You help visitors with:
- Current inventory and car details
- Pricing, condition, mileage, transmission, fuel type, and location
- Services: selling foreign-used and locally used cars, buying cars through our "Sell Your Car" program, and time-limited car auctions
- Location (Kahawa West, Nairobi, near Kamiti Rd), phone (+254 790 555 421), and email (spicegotcars@gmail.com)
- General questions about buying or selling a car with us

Current available listings (brief):
${listingsText || "- No active listings right now."}

Formatting guidelines:
- Use **bold** for key details like prices, names, or important info
- Use *italic* for emphasis
- Use bullet points (- item) for lists of options, features, or multiple items
- Keep paragraphs short and scannable
- Use [text](url) for links to pages on this site like /inventory, /services, /sell, /contact, /about, /auction
- Never say you cannot access real-time inventory — you have the latest list above.

CRITICAL: Do not output any internal reasoning, thinking process, <think> tags, <environment_details> blocks, or meta-commentary. Answer directly and concisely.`;
}

const chatSchema = z.object({
  message: z.string().min(1),
  history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .validator(chatSchema)
  .handler(async ({ data }) => {
    console.log("[chat-server] Handler called with data:", JSON.stringify(data).substring(0, 200));
    const { message, history } = data;

    const apiKey = process.env.GROQ_API_KEY;
    console.log("[chat-server] GROQ_API_KEY present:", !!apiKey, "length:", apiKey?.length);
    if (!apiKey) {
      return {
        reply:
          "Sorry, the chat service is not configured right now. Please try contacting us on WhatsApp or phone instead.",
      };
    }

    const listings = await fetchRecentListings();
    const systemPrompt = buildSystemPrompt(listings);
    console.log("[chat-server] System prompt length:", systemPrompt.length, "listings:", listings.length);

    try {
      console.log("[chat-server] Calling Groq API...");
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "groq/compound-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: message },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      console.log("[chat-server] Groq response status:", response.status, response.statusText);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[chat-server] Groq API error body:", errorText);
        return {
          reply:
            "Sorry, I'm having trouble connecting right now. Please try again later or reach us on WhatsApp.",
        };
      }

      const result = await response.json();
      console.log("[chat-server] Groq response parsed:", JSON.stringify(result).substring(0, 300));
      const rawReply =
        result.choices?.[0]?.message?.content ??
        "Sorry, I didn't get a proper response. Please try again.";

      const reply = rawReply
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/<environment_details>[\s\S]*?<\/environment_details>/g, "")
        .trim();

      return { reply };
    } catch (err) {
      console.error("[chat-server] Chat error:", err);
      return {
        reply:
          "Something went wrong on our end. Please try again later or contact us directly on WhatsApp.",
      };
    }
  });
