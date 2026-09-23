import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient } from "./supabase-server";
import { type Car, SAMPLE_CARS } from "../data/listings";
import { GoogleGenAI } from "@google/genai";

const SITE_BASE_URL = "https://spicegotcars.co.ke";

let genAIClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAIClient;
}

async function fetchRecentListings(): Promise<Car[]> {
  try {
    const supabase = createServerClient();
    if (!supabase) return SAMPLE_CARS.slice(0, 10);

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "available")
      .order("listed_at", { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) return SAMPLE_CARS.slice(0, 10);

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

function buildSystemPrompt(listings: Car[], pageContext?: string): string {
  const listingsText = listings
    .map(
      (car) =>
        `- ${car.year} ${car.make} ${car.model} ${car.trim ?? ""} — KES ${car.priceKes.toLocaleString()} (${car.condition})${car.location ? ` — ${car.location}` : ""}`,
    )
    .join("\n");

  const pageContextSection = pageContext
    ? `\nVisitor's Current Page Context:
The visitor is currently viewing: "${pageContext}".
Use this context to be immediately relevant and actionable:
- If the visitor is on a specific car's page (e.g. /inventory/... or /car/...), prioritize details about that car, explain its features/condition, and point them to buttons on the page (e.g., "WhatsApp Agent", "Make Inquiry", or "Chat" button).
- If they are on the inventory/catalog page (/inventory), suggest filters or highlight popular options.
- If they are on the sell page (/sell), explain how easy it is to submit their car details and get a quick appraisal.
- If they are on the auctions page (/auction), guide them on current bidding rules, starting bids, and deadlines.
- If they are on the contact page (/contact), remind them of our phone (+254 790 555 421) and location (Kahawa West, Nairobi).`
    : "";

  return `You are the built-in assistant for the Spice Got Cars website. You are already inside the site, so do not tell users to visit spicegotcars.co.ke or "our website" — you are speaking from within it.

You help visitors with:
- Current inventory and car details
- Pricing, condition, mileage, transmission, fuel type, and location
- Services: selling foreign-used and locally used cars, buying cars through our "Sell Your Car" program, and time-limited car auctions
- Location (Kahawa West, Nairobi, near Kamiti Rd), phone (+254 790 555 421), and email (spicegotcars@gmail.com)
- General questions about buying or selling a car with us
${pageContextSection}

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
  pageContext: z.string().optional(),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .validator(chatSchema)
  .handler(async ({ data }) => {
    const { message, history, pageContext } = data;
    const listings = await fetchRecentListings();
    const systemPrompt = buildSystemPrompt(listings, pageContext);

    // 1. Try Gemini API first (with fallback model for 503 spikes)
    const ai = getGenAIClient();
    if (ai) {
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
      const contents = [
        ...history.map((h) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: message }] },
      ];

      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: systemPrompt,
            },
          });
          const reply =
            response.text ||
            "I'm here to assist with Spice Got Cars vehicles and services. How can I help you?";
          return { reply };
        } catch (geminiErr: any) {
          const isOverloaded =
            geminiErr?.status === 503 ||
            geminiErr?.message?.includes("503") ||
            geminiErr?.message?.includes("demand");
          if (isOverloaded) {
            console.warn(
              `[chat-server] Gemini model ${model} temporarily unavailable (503), trying fallback...`,
            );
            continue;
          }
          console.error("[chat-server] Gemini API error:", geminiErr?.message || geminiErr);
          break;
        }
      }
    }

    // 2. Try Groq API as secondary fallback
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
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

        if (response.ok) {
          const result = await response.json();
          const rawReply =
            result.choices?.[0]?.message?.content ??
            "Sorry, I didn't get a proper response. Please try again.";

          const reply = rawReply
            .replace(/<think>[\s\S]*?<\/think>/g, "")
            .replace(/<environment_details>[\s\S]*?<\/environment_details>/g, "")
            .trim();

          return { reply };
        }
      } catch (groqErr) {
        console.error("[chat-server] Groq error:", groqErr);
      }
    }

    // 3. Fallback response with dealership information
    const lower = message.toLowerCase();
    let reply =
      "Welcome to **Spice Got Cars**! We are located in **Kahawa West, Kamiti Road, Nairobi**. ";
    if (
      lower.includes("price") ||
      lower.includes("cost") ||
      lower.includes("prado") ||
      lower.includes("car") ||
      lower.includes("inventory")
    ) {
      reply +=
        "You can browse all our verified cars with full pricing, photos, and specs in the [Inventory](/inventory) or check ongoing bids in our [Auctions](/auction). ";
    } else if (lower.includes("sell")) {
      reply +=
        "Looking to sell your car? You can submit your vehicle details easily through our [Sell Your Car](/sell) page for a fast review. ";
    } else {
      reply += "We'd love to help you find or sell your car! ";
    }
    reply += "Feel free to message us on WhatsApp at **+254 790 555 421** or call us directly.";

    return { reply };
  });
