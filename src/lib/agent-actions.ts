import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServiceClient } from "./supabase-server";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "sgc_agent_salt_2024");
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

const loginSchema = z.object({
  identifier: z.string().min(1, "Please enter your email, phone, or ID number"),
  password: z.string().min(1, "Please enter your password"),
});

export const agentLogin = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    if (!supabase) {
      return { error: { message: "Supabase service role is not configured on the server" } };
    }

    const trimmed = data.identifier.trim();
    let agentRow: any = null;

    const byEmail = await supabase
      .from("agents")
      .select("*")
      .eq("email", trimmed.toLowerCase())
      .maybeSingle();

    if (byEmail.data) {
      agentRow = byEmail.data;
    } else {
      const byPhone = await supabase
        .from("agents")
        .select("*")
        .eq("phone", trimmed)
        .maybeSingle();

      if (byPhone.data) {
        agentRow = byPhone.data;
      } else {
        const byId = await supabase
          .from("agents")
          .select("*")
          .eq("id_number", trimmed)
          .maybeSingle();

        agentRow = byId.data || null;
      }
    }

    if (!agentRow) {
      return { error: { message: "No account found with that email, phone, or ID number" } };
    }

    const verified = await verifyPassword(data.password, agentRow.password_hash);
    if (!verified) {
      return { error: { message: "Incorrect password" } };
    }

    return {
      success: true,
      agent: {
        id: agentRow.id,
        name: agentRow.name,
        email: agentRow.email,
        phone: agentRow.phone,
        id_number: agentRow.id_number,
        approved: agentRow.approved,
        approved_until: agentRow.approved_until,
        created_at: agentRow.created_at,
      },
    };
  });

const signupSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  idNumber: z.string().min(1, "ID number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const agentSignUp = createServerFn({ method: "POST" })
  .validator(signupSchema)
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    if (!supabase) {
      return { error: { message: "Supabase service role is not configured on the server" } };
    }

    const cleanEmail = data.email.toLowerCase().trim();
    const cleanPhone = data.phone.trim();
    const cleanId = data.idNumber.trim();

    const existingEmail = await supabase
      .from("agents")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingEmail.data) {
      return { error: { message: "An account with this email already exists" } };
    }

    const existingPhone = await supabase
      .from("agents")
      .select("id")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (existingPhone.data) {
      return { error: { message: "An account with this phone number already exists" } };
    }

    const existingId = await supabase
      .from("agents")
      .select("id")
      .eq("id_number", cleanId)
      .maybeSingle();

    if (existingId.data) {
      return { error: { message: "An account with this ID number already exists" } };
    }

    const passwordHash = await hashPassword(data.password);

    const { error: insertError } = await supabase.from("agents").insert({
      name: data.name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      id_number: cleanId,
      password_hash: passwordHash,
    });

    if (insertError) {
      console.error("[agent-actions] Signup insert error:", insertError);
      return { error: { message: insertError.message || "Failed to create account" } };
    }

    return { success: true };
  });

const submitPaymentSchema = z.object({
  agentId: z.string().min(1),
  mpesaRef: z.string().min(1, "M-PESA reference code is required"),
});

export const submitAgentPayment = createServerFn({ method: "POST" })
  .validator(submitPaymentSchema)
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    if (!supabase) {
      return { error: { message: "Supabase service role is not configured on the server" } };
    }

    const { agentId, mpesaRef } = data;

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id")
      .eq("id", agentId)
      .maybeSingle();

    if (agentError || !agent) {
      return { error: { message: "Agent account not found" } };
    }

    const { data: payment, error } = await supabase
      .from("agent_payments")
      .insert({
        agent_id: agentId,
        mpesa_ref: mpesaRef.trim().toUpperCase(),
        amount: 2000,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      console.error("[agent-actions] Payment submission error:", error);
      return { error: { message: error.message || "Failed to submit payment reference" } };
    }

    return { success: true, payment };
  });

const getAgentListingsSchema = z.object({
  agentId: z.string().min(1),
});

export const getAgentListings = createServerFn({ method: "POST" })
  .validator(getAgentListingsSchema)
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    if (!supabase) {
      return { error: { message: "Supabase service role is not configured on the server" }, listings: [] };
    }

    const { data: listings, error } = await supabase
      .from("listings")
      .select("*")
      .eq("agent_id", data.agentId)
      .order("listed_at", { ascending: false });

    if (error) {
      if (error.code === "42703") {
        return {
          error: {
            code: "COLUMN_MISSING",
            message:
              "The 'agent_id' column is missing from the 'listings' table. Please execute the migration file (20250912_add_agent_id_to_listings.sql) in your Supabase SQL Editor.",
          },
          listings: [],
        };
      }
      return { error: { message: error.message }, listings: [] };
    }

    const withPhotos = await Promise.all(
      (listings || []).map(async (listing: any) => {
        const { data: photos } = await supabase
          .from("listing_photos")
          .select("storage_path")
          .eq("listing_id", listing.id)
          .order("sort_order", { ascending: true });

        return { ...listing, photos: photos?.map((p: any) => p.storage_path) || [] };
      }),
    );

    return { success: true, listings: withPhotos };
  });

const agentListingFormSchema = z.object({
  agentId: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().optional(),
  year: z.number().int(),
  priceKes: z.number().positive(),
  negotiable: z.boolean(),
  mileageKm: z.number().nonnegative(),
  transmission: z.enum(["Automatic", "Manual"]),
  fuelType: z.enum(["Petrol", "Diesel", "Hybrid", "Electric"]),
  engineSize: z.string(),
  bodyType: z.enum(["SUV", "Saloon", "Hatchback", "Pickup", "Wagon", "Coupe"]),
  condition: z.enum(["New", "Foreign Used", "Locally Used"]),
  description: z.string(),
  status: z.enum(["available", "reserved", "sold"]),
  logbookVerified: z.boolean().optional(),
  isAuction: z.boolean(),
  location: z.string().nullable().optional(),
  locationPin: z.string().nullable().optional(),
});

export const createAgentListing = createServerFn({ method: "POST" })
  .validator(agentListingFormSchema)
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    if (!supabase) {
      return { error: { message: "Supabase service role is not configured on the server" } };
    }

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, approved")
      .eq("id", data.agentId)
      .maybeSingle();

    if (agentError || !agent) {
      return { error: { message: "Agent account not found" } };
    }

    if (!agent.approved) {
      const { count, error: countError } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", data.agentId);

      if (!countError && (count || 0) >= 2) {
        return {
          error: {
            message: "Unapproved accounts can only create up to 2 listings. Please activate your account.",
          },
        };
      }
    }

    const auctionWindows = data.isAuction && (data as any).auctionWindows
      ? (data as any).auctionWindows.map((w: any) => ({
          listing_id: "",
          starts_at: new Date(w.startsAt).toISOString(),
          ends_at: new Date(w.endsAt).toISOString(),
        }))
      : [];

      const { data: listing, error: insertError } = await supabase
      .from("listings")
      .insert({
        agent_id: data.agentId,
        make: data.make,
        model: data.model,
        trim: data.trim || null,
        year: data.year,
        price_kes: data.priceKes,
        negotiable: data.negotiable,
        mileage_km: data.mileageKm,
        transmission: data.transmission,
        fuel_type: data.fuelType,
        engine_size: data.engineSize,
        body_type: data.bodyType,
        condition: data.condition,
        description: data.description,
        status: data.status,
        logbook_verified: data.logbookVerified || false,
        is_auction: data.isAuction,
        location: data.location || null,
        location_pin: data.locationPin || null,
        listed_at: new Date().toISOString().split("T")[0],
      })
      .select("*")
      .single();

    if (insertError) {
      if (insertError.code === "42703") {
        return {
          error: {
            message:
              "The 'agent_id' column is missing from the 'listings' table. Please run the SQL migration in Supabase SQL Editor.",
          },
        };
      }
      return { error: { message: insertError.message || "Failed to create listing" } };
    }

    if (listing && auctionWindows.length > 0) {
      const { error: windowsError } = await supabase.from("auction_windows").insert(
        auctionWindows.map((w) => ({
          listing_id: listing.id,
          starts_at: w.starts_at,
          ends_at: w.ends_at,
        })),
      );
      if (windowsError) {
        console.error("Failed to create auction windows:", windowsError);
      }
    }

    return { success: true, listing };
  });

const getAgentListingByIdSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
});

export const getAgentListingById = createServerFn({ method: "POST" })
  .validator(getAgentListingByIdSchema)
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    if (!supabase) {
      return { error: { message: "Supabase service role is not configured on the server" }, listing: null };
    }

    const { data: listing, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", data.id)
      .eq("agent_id", data.agentId)
      .maybeSingle();

    if (error || !listing) {
      return { error: { message: error?.message || "Listing not found" }, listing: null };
    }

    const { data: photos } = await supabase
      .from("listing_photos")
      .select("id, storage_path, sort_order")
      .eq("listing_id", listing.id)
      .order("sort_order", { ascending: true });

    const { data: windows } = await supabase
      .from("auction_windows")
      .select("id, starts_at, ends_at")
      .eq("listing_id", listing.id)
      .order("starts_at", { ascending: true });

    return {
      success: true,
      listing: {
        ...listing,
        photos: photos?.map((p: any) => p.storage_path) || [],
        photoDetails: photos?.map((p: any) => ({ id: p.id, storagePath: p.storage_path, sortOrder: p.sort_order })) || [],
        auctionWindows: windows?.map((w: any) => ({
          id: w.id,
          startsAt: w.starts_at,
          endsAt: w.ends_at,
        })) || [],
      },
    };
  });

const updateAgentListingSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().optional(),
  year: z.number().int(),
  priceKes: z.number().positive(),
  negotiable: z.boolean(),
  mileageKm: z.number().nonnegative(),
  transmission: z.enum(["Automatic", "Manual"]),
  fuelType: z.enum(["Petrol", "Diesel", "Hybrid", "Electric"]),
  engineSize: z.string(),
  bodyType: z.enum(["SUV", "Saloon", "Hatchback", "Pickup", "Wagon", "Coupe"]),
  condition: z.enum(["New", "Foreign Used", "Locally Used"]),
  description: z.string(),
  status: z.enum(["available", "reserved", "sold"]),
  logbookVerified: z.boolean().optional(),
  isAuction: z.boolean(),
  location: z.string().nullable().optional(),
  locationPin: z.string().nullable().optional(),
});

export const updateAgentListing = createServerFn({ method: "POST" })
  .validator(updateAgentListingSchema)
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    if (!supabase) {
      return { error: { message: "Supabase service role is not configured on the server" } };
    }

    const { error } = await supabase
      .from("listings")
      .update({
        make: data.make,
        model: data.model,
        trim: data.trim || null,
        year: data.year,
        price_kes: data.priceKes,
        negotiable: data.negotiable,
        mileage_km: data.mileageKm,
        transmission: data.transmission,
        fuel_type: data.fuelType,
        engine_size: data.engineSize,
        body_type: data.bodyType,
        condition: data.condition,
        description: data.description,
        status: data.status,
        logbook_verified: data.logbookVerified || false,
        is_auction: data.isAuction,
        location: data.location || null,
        location_pin: data.locationPin || null,
      })
      .eq("id", data.id)
      .eq("agent_id", data.agentId);

    if (error) {
      return { error: { message: error.message || "Failed to update listing" } };
    }

    return { success: true };
  });

const uploadAgentListingPhotosSchema = z.object({
  listingId: z.string().min(1),
  agentId: z.string().min(1),
  photos: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      base64: z.string(),
    }),
  ),
});

export const uploadAgentListingPhotos = createServerFn({ method: "POST" })
  .validator(uploadAgentListingPhotosSchema)
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    if (!supabase) {
      return { error: { message: "Supabase service role is not configured on the server" }, urls: [] };
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id")
      .eq("id", data.listingId)
      .eq("agent_id", data.agentId)
      .single();

    if (listingError || !listing) {
      return { error: { message: "Listing not found or access denied" }, urls: [] };
    }

    const uploadedUrls: string[] = [];

    for (let i = 0; i < data.photos.length; i++) {
      const photo = data.photos[i];
      const ext = photo.name.split(".").pop() || "jpg";
      const path = `${data.agentId}/${data.listingId}/${Date.now()}-${i}.${ext}`;

      const buffer = Buffer.from(photo.base64, "base64");

      const { error: uploadError } = await supabase.storage.from("car-photos").upload(path, buffer, {
        contentType: photo.type,
        upsert: false,
      });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from("car-photos").getPublicUrl(path);

      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);

        await supabase.from("listing_photos").insert({
          listing_id: data.listingId,
          storage_path: publicUrlData.publicUrl,
          sort_order: uploadedUrls.length - 1,
        });
      }
    }

    return { success: true, urls: uploadedUrls };
  });

const removeAgentListingPhotoSchema = z.object({
  photoId: z.string().min(1),
  listingId: z.string().min(1),
  agentId: z.string().min(1),
});

export const removeAgentListingPhoto = createServerFn({ method: "POST" })
  .validator(removeAgentListingPhotoSchema)
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    if (!supabase) {
      return { error: { message: "Supabase service role is not configured on the server" } };
    }

    const { data: photo, error: photoError } = await supabase
      .from("listing_photos")
      .select("storage_path, id")
      .eq("id", data.photoId)
      .eq("listing_id", data.listingId)
      .single();

    if (photoError || !photo) {
      return { error: { message: "Photo not found" } };
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("agent_id")
      .eq("id", data.listingId)
      .single();

    if (listingError || !listing || listing.agent_id !== data.agentId) {
      return { error: { message: "Access denied" } };
    }

    const path = photo.storage_path.split("/car-photos/")[1];
    if (path) {
      await supabase.storage.from("car-photos").remove([path]);
    }

    await supabase.from("listing_photos").delete().eq("id", data.photoId);

    return { success: true };
  });

const updateAuctionWindowsSchema = z.object({
  listingId: z.string().min(1),
  agentId: z.string().min(1),
  windows: z.array(
    z.object({
      startsAt: z.string(),
      endsAt: z.string(),
    }),
  ),
});

export const updateAuctionWindows = createServerFn({ method: "POST" })
  .validator(updateAuctionWindowsSchema)
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    if (!supabase) {
      return { error: { message: "Supabase service role is not configured on the server" } };
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("agent_id")
      .eq("id", data.listingId)
      .single();

    if (listingError || !listing || listing.agent_id !== data.agentId) {
      return { error: { message: "Access denied" } };
    }

    await supabase.from("auction_windows").delete().eq("listing_id", data.listingId);

    if (data.windows.length > 0) {
      const windowsToInsert = data.windows.map((w) => ({
        listing_id: data.listingId,
        starts_at: new Date(w.startsAt).toISOString(),
        ends_at: new Date(w.endsAt).toISOString(),
      }));

      const { error: insertError } = await supabase.from("auction_windows").insert(windowsToInsert);
      if (insertError) {
        return { error: { message: "Failed to update auction windows" } };
      }
    }

    return { success: true };
  });
