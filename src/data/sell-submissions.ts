import { createClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SellSubmission {
  id: string;
  name: string;
  phone: string;
  make: string;
  model: string;
  year: number;
  mileage_km: number;
  engine_capacity?: number;
  condition: "New" | "Foreign Used" | "Locally Used";
  asking_price: number;
  location: string;
  notes?: string;
  photos: string[];
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

function getClient(supabase?: SupabaseClient) {
  const client = supabase || createServerClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }
  return client;
}

export async function createSellSubmission(
  data: {
    name: string;
    phone: string;
    make: string;
    model: string;
    year: number;
    mileageKm: number;
    engineCapacityCc?: number;
    condition: "New" | "Foreign Used" | "Locally Used";
    askingPrice: number;
    location: string;
    notes?: string;
    photos: string[];
  },
  supabase?: SupabaseClient
): Promise<SellSubmission> {
  const client = getClient(supabase);
  const insertPayload = {
    name: data.name,
    phone: data.phone,
    make: data.make,
    model: data.model,
    year: data.year,
    mileage_km: data.mileageKm,
    engine_capacity: data.engineCapacityCc || null,
    condition: data.condition,
    asking_price: data.askingPrice,
    location: data.location,
    notes: data.notes || null,
    photos: data.photos,
  };

  const { data: submission, error } = await client
    .from("sell_submissions")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !submission) {
    console.error("Failed to create sell submission:", error);
    throw new Error(error?.message || "Failed to create submission");
  }

  const notifClient = getClient(supabase);
  const { error: notifError } = await notifClient
    .from("notifications")
    .insert({
      type: "new_submission",
      message: `New sell submission: ${data.year} ${data.make} ${data.model} (KES ${data.askingPrice.toLocaleString()})`,
    });

  if (notifError) {
    console.error("Failed to create notification:", notifError);
  }

  return submission as SellSubmission;
}

export async function fetchSellSubmissions(
  supabase?: SupabaseClient
): Promise<SellSubmission[]> {
  try {
    const client = getClient(supabase);
    const { data, error } = await client
      .from("sell_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Failed to fetch sell submissions:", error);
      return [];
    }

    return data as SellSubmission[];
  } catch (err) {
    console.error("Failed to fetch sell submissions:", err);
    return [];
  }
}

export async function updateSellSubmissionStatus(
  id: string,
  status: "approved" | "rejected",
  supabase?: SupabaseClient
): Promise<boolean> {
  try {
    const client = getClient(supabase);
    const { error } = await client
      .from("sell_submissions")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Failed to update submission status:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to update submission status:", err);
    return false;
  }
}

export async function fetchNotifications(
  supabase?: SupabaseClient
): Promise<Notification[]> {
  try {
    const client = getClient(supabase);
    const { data, error } = await client
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      console.error("Failed to fetch notifications:", error);
      return [];
    }

    return data as Notification[];
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    return [];
  }
}

export async function fetchUnreadNotificationCount(
  supabase?: SupabaseClient
): Promise<number> {
  try {
    const client = getClient(supabase);
    const { count, error } = await client
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false);

    if (error) {
      console.error("Failed to fetch notification count:", error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error("Failed to fetch notification count:", err);
    return 0;
  }
}

export async function deleteSellSubmission(
  id: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  try {
    const client = getClient(supabase);

    const { data: submission } = await client
      .from("sell_submissions")
      .select("photos")
      .eq("id", id)
      .single();

    if (submission?.photos && Array.isArray(submission.photos)) {
      for (const photoUrl of submission.photos) {
        try {
          const path = photoUrl.split("/car-photos/")[1];
          if (path) {
            await client.storage.from("car-photos").remove([path]);
          }
        } catch (storageErr) {
          console.error("Failed to delete photo from storage:", storageErr);
        }
      }
    }

    const { error } = await client
      .from("sell_submissions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete sell submission:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to delete sell submission:", err);
    return false;
  }
}

export async function markNotificationAsRead(
  id: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  try {
    const client = getClient(supabase);
    const { error } = await client
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      console.error("Failed to mark notification as read:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
    return false;
  }
}

export async function markAllNotificationsAsRead(
  supabase?: SupabaseClient
): Promise<boolean> {
  try {
    const client = getClient(supabase);
    const { error } = await client
      .from("notifications")
      .update({ read: true })
      .eq("read", false);

    if (error) {
      console.error("Failed to mark all notifications as read:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err);
    return false;
  }
}

export async function deleteNotification(
  id: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  try {
    const client = getClient(supabase);
    const { error } = await client
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete notification:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to delete notification:", err);
    return false;
  }
}
