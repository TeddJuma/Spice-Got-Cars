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
import { ArrowLeft, X } from "lucide-react";

export const Route = createFileRoute("/admin/$id")({
  loader: async ({ params }) => {
    const supabase = createServerClient();
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

    return { listing: { ...data, photos: photos || [] } };
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
    auctionEndsAt: listing.auction_ends_at ? new Date(listing.auction_ends_at).slice(0, 16) : "",
    startingBidKes: listing.starting_bid_kes ?? listing.price_kes,
    currentBidKes: listing.current_bid_kes ?? listing.price_kes,
  });

  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState(listing.photos);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
          auction_ends_at: form.isAuction && form.auctionEndsAt ? new Date(form.auctionEndsAt).toISOString() : null,
          starting_bid_kes: form.isAuction ? form.startingBidKes : null,
          current_bid_kes: form.isAuction ? form.currentBidKes : null,
        })
        .eq("id", listing.id);

      if (updateError) throw updateError;

      if (newPhotos.length > 0) {
        for (let i = 0; i < newPhotos.length; i++) {
          const file = newPhotos[i];
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${user!.id}/${listing.id}/${Date.now()}-${i}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("car-photos")
            .upload(path, file, { contentType: file.type, upsert: false });

          if (uploadError) continue;

          const { data: publicUrlData } = supabase.storage.from("car-photos").getPublicUrl(path);

          await supabase.from("listing_photos").insert({
            listing_id: listing.id,
            storage_path: publicUrlData.publicUrl,
            sort_order: existingPhotos.length + i,
          });
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

        <div className="flex items-center gap-4">
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
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Bid Ends By</Label>
              <Input
                type="datetime-local"
                required={form.isAuction}
                value={form.auctionEndsAt}
                onChange={(e) => updateField("auctionEndsAt", e.target.value)}
              />
            </div>
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
        )}

        <div>
          <Label>Photos</Label>
          {existingPhotos.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.storage_path}
                    alt=""
                    className="h-24 w-32 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingPhoto(photo)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photoUrls.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {photoUrls.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="h-24 w-32 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(i)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white"
                  >
                    <X className="size-3" />
                  </button>
                </div>
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
    </div>
  );
}
