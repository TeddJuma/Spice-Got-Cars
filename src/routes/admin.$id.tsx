import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/$id")({
  loader: async ({ params }) => {
    const supabase = createServerClient();
    if (!supabase) {
      throw notFound();
    }

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) throw notFound();

    const { data: photos } = await supabase
      .from("listing_photos")
      .select("id, storage_path")
      .eq("listing_id", params.id)
      .order("sort_order", { ascending: true });

    const { data: windows } = await supabase
      .from("auction_windows")
      .select("id, starts_at, ends_at")
      .eq("listing_id", params.id)
      .order("starts_at", { ascending: true });

    return {
      listing: {
        ...data,
        photos: photos || [],
        auctionWindows: windows?.map((w: any) => ({
          id: w.id,
          startsAt: w.starts_at,
          endsAt: w.ends_at,
        })) || [],
      },
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Listing not found</h1>
      <p className="mt-2 text-brand-muted">This car may have been sold or removed.</p>
      <Link
        to="/admin"
        className="mt-6 inline-block rounded-lg bg-brand-navy px-5 py-2 text-sm font-bold text-white"
      >
        Back to admin
      </Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    console.error(error);
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-brand-muted">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-brand-navy px-5 py-2 text-sm font-bold text-white"
        >
          Try again
        </button>
      </div>
    );
  },
  component: EditListingPage,
});

function EditListingPage() {
  const { user, loading } = useAuth();
  const { listing } = Route.useLoaderData();
  const supabase = createClient();

  const [form, setForm] = useState({
    make: listing.make,
    model: listing.model,
    trim: listing.trim || "",
    year: listing.year,
    priceKes: listing.price_kes,
    negotiable: listing.negotiable,
    mileageKm: listing.mileage_km,
    transmission: listing.transmission as "Automatic" | "Manual",
    fuelType: listing.fuel_type,
    engineSize: listing.engine_size,
    bodyType: listing.body_type,
    condition: listing.condition as "New" | "Foreign Used" | "Locally Used",
    description: listing.description,
    status: listing.status as "available" | "reserved" | "sold",
    ntsaInspected: listing.ntsa_inspected,
    logbookVerified: listing.logbook_verified,
    isAuction: listing.is_auction,
    startingBidKes: listing.starting_bid_kes ?? listing.price_kes,
    currentBidKes: listing.current_bid_kes ?? listing.price_kes,
    location: listing.location || "",
    locationPin: listing.location_pin || "",
    auctionWindows: (listing.auctionWindows || []).map((w) => ({
      startsAt: w.startsAt ? new Date(w.startsAt).toISOString().slice(0, 16) : "",
      endsAt: w.endsAt ? new Date(w.endsAt).toISOString().slice(0, 16) : "",
    })),
  });

  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState(listing.photos);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading]);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewPhotos((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPhotoUrls((prev) => [...prev, ...urls]);
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingPhoto = async (photo: any) => {
    if (!supabase) return;
    if (!confirm("Remove this photo?")) return;
    await supabase.from("listing_photos").delete().eq("id", photo.id);
    const path = photo.storage_path.split("/car-photos/")[1];
    if (path) {
      await supabase.storage.from("car-photos").remove([path]);
    }
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from("listings")
        .update({
          make: form.make,
          model: form.model,
          trim: form.trim || null,
          year: form.year,
          price_kes: form.priceKes,
          negotiable: form.negotiable,
          mileage_km: form.mileageKm,
          transmission: form.transmission,
          fuel_type: form.fuelType,
          engine_size: form.engineSize,
          body_type: form.bodyType,
          condition: form.condition,
          description: form.description,
          status: form.status,
          ntsa_inspected: form.ntsaInspected,
          logbook_verified: form.logbookVerified,
          is_auction: form.isAuction,
          auction_ends_at: null,
          starting_bid_kes: form.isAuction ? form.startingBidKes : null,
          current_bid_kes: form.isAuction ? form.currentBidKes : null,
          location: form.location || null,
          location_pin: form.locationPin || null,
        })
        .eq("id", listing.id);

      if (updateError) throw updateError;

      if (form.isAuction) {
        await supabase.from("auction_windows").delete().eq("listing_id", listing.id);

        const windowsToUpsert = form.auctionWindows
          .filter((w) => w.startsAt && w.endsAt)
          .map((w) => ({
            listing_id: listing.id,
            starts_at: new Date(w.startsAt).toISOString(),
            ends_at: new Date(w.endsAt).toISOString(),
          }));

        if (windowsToUpsert.length > 0) {
          const { error: windowsError } = await supabase.from("auction_windows").insert(windowsToUpsert);
          if (windowsError) {
            console.error("Failed to update auction windows:", windowsError);
          }
        }
      } else {
        await supabase.from("auction_windows").delete().eq("listing_id", listing.id);
      }

      if (updateError) throw updateError;

      if (newPhotos.length > 0) {
        let uploadFailed = false;
        for (let i = 0; i < newPhotos.length; i++) {
          const file = newPhotos[i];
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${user!.id}/${listing.id}/${Date.now()}-${i}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("car-photos")
            .upload(path, file, { contentType: file.type, upsert: false });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            uploadFailed = true;
            continue;
          }

          const { data: publicUrlData } = supabase.storage.from("car-photos").getPublicUrl(path);

          if (publicUrlData?.publicUrl) {
            await supabase.from("listing_photos").insert({
              listing_id: listing.id,
              storage_path: publicUrlData.publicUrl,
              sort_order: existingPhotos.length + i,
            });
          }
        }

        if (uploadFailed) {
          setError("Some photos failed to upload. Please try again or contact support.");
        }
      }

      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-brand-muted">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link
        to="/admin"
        className="inline-flex items-center text-sm text-brand-muted hover:text-brand-navy"
      >
        <ArrowLeft className="mr-1 size-4" /> Back to admin
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-brand-navy">Edit listing</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Make</Label>
            <Input
              required
              value={form.make}
              onChange={(e) => updateField("make", e.target.value)}
            />
          </div>
          <div>
            <Label>Model</Label>
            <Input
              required
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
            />
          </div>
          <div>
            <Label>Trim</Label>
            <Input value={form.trim} onChange={(e) => updateField("trim", e.target.value)} />
          </div>
          <div>
            <Label>Year</Label>
            <Input
              type="number"
              required
              value={form.year}
              onChange={(e) => updateField("year", parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label>Price (KES)</Label>
            <Input
              type="number"
              required
              value={form.priceKes}
              onChange={(e) => updateField("priceKes", parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label>Mileage (km)</Label>
            <Input
              type="number"
              required
              value={form.mileageKm}
              onChange={(e) => updateField("mileageKm", parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label>Transmission</Label>
            <Select value={form.transmission} onValueChange={(v) => updateField("transmission", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Automatic">Automatic</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fuel Type</Label>
            <Input
              value={form.fuelType}
              onChange={(e) => updateField("fuelType", e.target.value)}
            />
          </div>
          <div>
            <Label>Engine Size</Label>
            <Input
              required
              value={form.engineSize}
              onChange={(e) => updateField("engineSize", e.target.value)}
            />
          </div>
          <div>
            <Label>Body Type</Label>
            <Select value={form.bodyType} onValueChange={(v) => updateField("bodyType", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUV">SUV</SelectItem>
                <SelectItem value="Saloon">Saloon</SelectItem>
                <SelectItem value="Hatchback">Hatchback</SelectItem>
                <SelectItem value="Pickup">Pickup</SelectItem>
                <SelectItem value="Wagon">Wagon</SelectItem>
                <SelectItem value="Coupe">Coupe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Condition</Label>
            <Select value={form.condition} onValueChange={(v) => updateField("condition", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Foreign Used">Foreign Used</SelectItem>
                <SelectItem value="Locally Used">Locally Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            required
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>General Location</Label>
            <Input
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="e.g. Kahawa West, Nairobi"
            />
          </div>
          <div>
            <Label>Location Pin (optional)</Label>
            <Input
              value={form.locationPin}
              onChange={(e) => updateField("locationPin", e.target.value)}
              placeholder="e.g. -1.2345, 36.7890"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={form.negotiable}
              onCheckedChange={(v) => updateField("negotiable", v)}
            />
            <Label className="!mt-0">Negotiable price</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.ntsaInspected}
              onCheckedChange={(v) => updateField("ntsaInspected", v)}
            />
            <Label className="!mt-0">NTSA inspected</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.logbookVerified}
              onCheckedChange={(v) => updateField("logbookVerified", v)}
            />
            <Label className="!mt-0">Logbook verified</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isAuction}
              onCheckedChange={(v) => updateField("isAuction", v)}
            />
            <Label className="!mt-0">Auction listing</Label>
          </div>
        </div>

        {form.isAuction && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Starting bid (KES)</Label>
                <Input
                  type="number"
                  required={form.isAuction}
                  value={form.startingBidKes}
                  onChange={(e) => updateField("startingBidKes", parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Current bid (KES)</Label>
                <Input
                  type="number"
                  required={form.isAuction}
                  value={form.currentBidKes}
                  onChange={(e) => updateField("currentBidKes", parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Auction Windows</Label>
              <p className="text-xs text-brand-muted">Add one or more time windows when bidding is open. Bidding is only available during these windows.</p>
              {form.auctionWindows.map((window, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="mb-1 block text-xs font-medium text-brand-muted">Starts</label>
                    <Input
                      type="datetime-local"
                      value={window.startsAt}
                      onChange={(e) => {
                        const newWindows = [...form.auctionWindows];
                        newWindows[index] = { ...newWindows[index], startsAt: e.target.value };
                        updateField("auctionWindows", newWindows);
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="mb-1 block text-xs font-medium text-brand-muted">Ends</label>
                    <Input
                      type="datetime-local"
                      value={window.endsAt}
                      onChange={(e) => {
                        const newWindows = [...form.auctionWindows];
                        newWindows[index] = { ...newWindows[index], endsAt: e.target.value };
                        updateField("auctionWindows", newWindows);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateField("auctionWindows", form.auctionWindows.filter((_, i) => i !== index));
                    }}
                    className="mt-5 rounded-lg p-2 text-red-600 hover:bg-red-50"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateField("auctionWindows", [...form.auctionWindows, { startsAt: "", endsAt: "" }])}
                className="text-sm font-semibold text-brand-accent hover:underline"
              >
                + Add auction window
              </button>
            </div>
          </div>
        )}

        <div>
          <Label>Photos</Label>
          {existingPhotos.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {existingPhotos.map((photo, idx) => {
                const globalIndex = existingPhotos.slice(0, idx).length + photoUrls.length;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setViewerIndex(globalIndex)}
                    className="relative overflow-hidden rounded-lg border border-slate-200 transition hover:ring-2 hover:ring-brand-accent"
                  >
                    <img
                      src={photo.storage_path}
                      alt=""
                      className="h-24 w-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeExistingPhoto(photo);
                      }}
                      className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </button>
                );
              })}
            </div>
          )}
          {photoUrls.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {photoUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setViewerIndex(existingPhotos.length + i)}
                  className="relative overflow-hidden rounded-lg border border-slate-200 transition hover:ring-2 hover:ring-brand-accent"
                >
                  <img src={url} alt="" className="h-24 w-32 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNewPhoto(i);
                    }}
                    className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white"
                  >
                    <X className="size-3" />
                  </button>
                </button>
              ))}
            </div>
          )}
          <div className="mt-2">
            <Input type="file" accept="image/*" multiple onChange={handlePhotoChange} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Saving..." : "Save changes"}
        </Button>
      </form>

      {viewerIndex !== null && (existingPhotos[viewerIndex] || photoUrls[viewerIndex - existingPhotos.length]) && (
        <Lightbox
          photos={[...existingPhotos.map((p) => p.storage_path), ...photoUrls]}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
}) {
  const [viewerIndex, setViewerIndex] = useState(index);
  const photoCount = photos.length;
  const step = (dir: number) =>
    setViewerIndex((i) => (i + dir + photoCount) % photoCount);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
      >
        <X className="size-6" />
      </button>
      {photoCount > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
      <img
        src={photos[viewerIndex]}
        alt={`Photo ${viewerIndex + 1}`}
        className="max-h-[85vh] max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
