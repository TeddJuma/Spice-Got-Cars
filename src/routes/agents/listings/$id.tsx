import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAgentAuth } from "@/lib/agent-auth-context";
import {
  getAgentListingById,
  updateAgentListing,
  uploadAgentListingPhotos,
  removeAgentListingPhoto,
  updateAuctionWindows,
} from "@/lib/agent-actions";
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
import ChatButton from "@/components/messaging/ChatButton";
import { toast } from "sonner";

export const Route = createFileRoute("/agents/listings/$id")({
  component: AgentEditListing,
});

type PhotoItem = { kind: "new"; file: File; url: string };

function AgentEditListing({ params }: { params: { id: string } }) {
  const { agent, loading } = useAgentAuth();
  const [form, setForm] = useState<any>({
    make: "", model: "", trim: "", year: 2024, priceKes: 0, negotiable: false,
    mileageKm: 0, transmission: "Automatic", fuelType: "Petrol", engineSize: "",
    bodyType: "SUV", condition: "Foreign Used", description: "", status: "available",
    logbookVerified: false, isAuction: false, startingBidKes: 0, currentBidKes: 0,
    location: "", locationPin: "", auctionWindows: [] as Array<{ startsAt: string; endsAt: string }>,
  });
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoDetails, setPhotoDetails] = useState<Array<{ id: string; storagePath: string; sortOrder: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingListing, setLoadingListing] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !agent) return;
    const load = async () => {
      try {
        const res = await getAgentListingById({ data: { id: params.id, agentId: agent!.id } });
        if (res.error || !res.listing) {
          toast.error(res.error?.message || "Listing not found.");
          return;
        }
        const listing = res.listing;
        setForm({
          make: listing.make || "",
          model: listing.model || "",
          trim: listing.trim || "",
          year: listing.year || 2024,
          priceKes: listing.price_kes || 0,
          negotiable: listing.negotiable ?? false,
          mileageKm: listing.mileage_km || 0,
          transmission: listing.transmission || "Automatic",
          fuelType: listing.fuel_type || "Petrol",
          engineSize: listing.engine_size || "",
          bodyType: listing.body_type || "SUV",
          condition: listing.condition || "Foreign Used",
          description: listing.description || "",
          status: listing.status || "available",
          logbookVerified: listing.logbook_verified ?? false,
          isAuction: listing.is_auction ?? false,
          startingBidKes: listing.starting_bid_kes || listing.price_kes || 0,
          currentBidKes: listing.current_bid_kes || listing.price_kes || 0,
          location: listing.location || "",
          locationPin: listing.location_pin || "",
          auctionWindows: (listing.auctionWindows || []).map((w: any) => ({
            startsAt: w.startsAt ? new Date(w.startsAt).toISOString().slice(0, 16) : "",
            endsAt: w.endsAt ? new Date(w.endsAt).toISOString().slice(0, 16) : "",
          })),
        });
        setPhotoDetails((listing.photoDetails || []).map((p: any) => ({ id: p.id, storagePath: p.storagePath, sortOrder: p.sortOrder })));
      } catch {
        toast.error("Failed to load listing.");
      } finally {
        setLoadingListing(false);
      }
    };
    load();
  }, [agent, loading, params.id]);

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const items: PhotoItem[] = files.map((f) => ({
      kind: "new",
      file: f,
      url: URL.createObjectURL(f),
    }));
    setPhotos((prev) => [...prev, ...items]);
  };

  const removeLocalPhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
    setViewerIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!agent) return;

      const res = await updateAgentListing({
        data: {
          id: params.id,
          agentId: agent.id,
          make: form.make,
          model: form.model,
          year: form.year,
          priceKes: form.priceKes,
          negotiable: form.negotiable,
          mileageKm: form.mileageKm,
          transmission: form.transmission,
          fuelType: form.fuelType,
          engineSize: form.engineSize,
          bodyType: form.bodyType,
          condition: form.condition,
          description: form.description,
          status: form.status,
          isAuction: form.isAuction,
          location: form.location || null,
          locationPin: form.locationPin || null,
        },
      });

  if (res.error) {
        toast.error(res.error.message || "Failed to update listing.");
        setSubmitting(false);
        return;
      }

      if (photos.length > 0) {
        const base64Photos = await Promise.all(
          photos.map(async (p) => {
            return new Promise<{ name: string; type: string; base64: string }>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({ name: p.file.name, type: p.file.type, base64: (reader.result as string).split(",")[1] || "" });
              };
              reader.readAsDataURL(p.file);
            });
          }),
        );

        const uploadRes = await uploadAgentListingPhotos({
          data: { listingId: params.id, agentId: agent.id, photos: base64Photos },
        });
        if (uploadRes.error) {
          toast.error(uploadRes.error.message || "Some photo uploads failed.");
        }
      }

      if (form.isAuction) {
        const validWindows = form.auctionWindows.filter((w) => w.startsAt && w.endsAt);
        const winRes = await updateAuctionWindows({
          data: { listingId: params.id, agentId: agent.id, windows: validWindows },
        });
        if (winRes.error) {
          toast.error(winRes.error.message || "Failed to update auction windows.");
        }
      } else {
        const winRes = await updateAuctionWindows({
          data: { listingId: params.id, agentId: agent.id, windows: [] },
        });
        if (winRes.error) {
          toast.error(winRes.error.message || "Failed to clear auction windows.");
        }
      }

      toast.success("Listing updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveExistingPhoto = async (photoId: string) => {
    if (!agent) return;
    if (!confirm("Remove this photo?")) return;

    const res = await removeAgentListingPhoto({
      data: { photoId, listingId: params.id, agentId: agent.id },
    });

    if (res.error) {
      toast.error(res.error.message || "Failed to remove photo.");
    } else {
      toast.success("Photo removed.");
      setPhotoDetails((prev) => prev.filter((p) => p.id !== photoId));
      setViewerIndex(null);
    }
  };

  if (loading) {
    return <p className="mx-auto max-w-5xl px-4 py-12 text-brand-muted">Loading...</p>;
  }
  if (!agent) return null;
  if (loadingListing) {
    return <p className="mx-auto max-w-5xl px-4 py-12 text-brand-muted">Loading listing...</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Link
        to="/agents/dashboard"
        className="inline-flex items-center text-sm text-brand-muted hover:text-brand-navy"
      >
        <ArrowLeft className="mr-1 size-4" /> Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-brand-navy md:text-3xl">Edit listing</h1>

      <ChatButton listingId={params.id} role="agent" user={agent} />
      <form onSubmit={handleSubmit} className="mt-6 grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label>Make</Label>
            <Input required value={form.make} onChange={(e) => updateField("make", e.target.value)} />
          </div>
          <div>
            <Label>Model</Label>
            <Input required value={form.model} onChange={(e) => updateField("model", e.target.value)} />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label>Trim</Label>
            <Input value={form.trim} onChange={(e) => updateField("trim", e.target.value)} />
          </div>
          <div>
            <Label>Year</Label>
            <Input type="number" required value={form.year} onChange={(e) => updateField("year", Number(e.target.value))} />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label>Price (KES)</Label>
            <Input type="number" required value={form.priceKes} onChange={(e) => updateField("priceKes", Number(e.target.value))} />
          </div>
          <div>
            <Label>Mileage (km)</Label>
            <Input type="number" required value={form.mileageKm} onChange={(e) => updateField("mileageKm", Number(e.target.value))} />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label>Transmission</Label>
            <Select value={form.transmission} onValueChange={(v) => updateField("transmission", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Automatic">Automatic</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fuel Type</Label>
            <Input value={form.fuelType} onChange={(e) => updateField("fuelType", e.target.value)} />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label>Engine Size</Label>
            <Input required value={form.engineSize} onChange={(e) => updateField("engineSize", e.target.value)} />
          </div>
          <div>
            <Label>Body Type</Label>
            <Select value={form.bodyType} onValueChange={(v) => updateField("bodyType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label>Condition</Label>
            <Select value={form.condition} onValueChange={(v) => updateField("condition", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Textarea required value={form.description} onChange={(e) => updateField("description", e.target.value)} className="min-h-24" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>General Location</Label>
            <Input value={form.location} onChange={(e) => updateField("location", e.target.value)} placeholder="e.g. Kahawa West, Nairobi" />
          </div>
          <div>
            <Label>Location Pin (optional)</Label>
            <Input value={form.locationPin} onChange={(e) => updateField("locationPin", e.target.value)} placeholder="e.g. -1.2345, 36.7890" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={form.negotiable} onCheckedChange={(v) => updateField("negotiable", v)} />
            <Label className="!mt-0">Negotiable price</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.logbookVerified} onCheckedChange={(v) => updateField("logbookVerified", v)} />
            <Label className="!mt-0">Logbook verified</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.isAuction} onCheckedChange={(v) => updateField("isAuction", v)} />
            <Label className="!mt-0">Auction listing</Label>
          </div>
        </div>

        {form.isAuction && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Starting bid (KES)</Label>
              <Input type="number" required value={form.startingBidKes} onChange={(e) => updateField("startingBidKes", Number(e.target.value))} />
            </div>
            <div>
              <Label>Current bid (KES)</Label>
              <Input type="number" required value={form.currentBidKes} onChange={(e) => updateField("currentBidKes", Number(e.target.value))} />
            </div>
          </div>
        )}

        {form.isAuction && (
          <div className="space-y-3">
            <Label>Auction Windows</Label>
            <p className="text-xs text-brand-muted">Add one or more time windows when bidding is open. Bidding is only available during these windows.</p>
            {form.auctionWindows.map((window, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1 block text-xs font-medium text-brand-muted">Starts</label>
                  <Input type="datetime-local" value={window.startsAt} onChange={(e) => {
                    const newWindows = [...form.auctionWindows];
                    newWindows[index] = { ...newWindows[index], startsAt: e.target.value };
                    updateField("auctionWindows", newWindows);
                  }} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1 block text-xs font-medium text-brand-muted">Ends</label>
                  <Input type="datetime-local" value={window.endsAt} onChange={(e) => {
                    const newWindows = [...form.auctionWindows];
                    newWindows[index] = { ...newWindows[index], endsAt: e.target.value };
                    updateField("auctionWindows", newWindows);
                  }} />
                </div>
                <button type="button" onClick={() => updateField("auctionWindows", form.auctionWindows.filter((_: any, i: number) => i !== index))} className="mt-5 rounded-lg p-2 text-red-600 hover:bg-red-50">
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => updateField("auctionWindows", [...form.auctionWindows, { startsAt: "", endsAt: "" }])} className="text-sm font-semibold text-brand-accent hover:underline">
              + Add auction window
            </button>
          </div>
        )}

        <div>
          <Label>Photos</Label>
          <p className="mb-2 text-xs text-brand-muted">
            Add or remove photos. Click a photo to view it; the ✕ removes it.
          </p>
          {photoDetails.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3">
              {photoDetails.map((photo, i) => (
                <div key={photo.id} className="relative cursor-move rounded-lg">
                  <button type="button" onClick={() => setViewerIndex(i)} className="block overflow-hidden rounded-lg border border-slate-200 transition hover:ring-2 hover:ring-brand-accent">
                    <img src={photo.storagePath} alt="" className="h-24 w-32 object-cover" />
                  </button>
                  <button type="button" onClick={() => handleRemoveExistingPhoto(photo.id)} aria-label="Remove photo" className="absolute -right-2 -top-2 z-10 flex size-7 items-center justify-center rounded-full bg-red-600 text-white shadow-lg ring-2 ring-white transition hover:scale-110 hover:bg-red-700">
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <button type="button" key={i} onClick={() => setViewerIndex(i)} className="relative overflow-hidden rounded-lg border border-slate-200 transition hover:ring-2 hover:ring-brand-accent">
                  <img src={photo.url} alt="" className="h-24 w-32 object-cover" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeLocalPhoto(i); }} className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white">
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

      {viewerIndex !== null && (
        <AgentLightbox
          photoUrls={[...photoDetails.map((p) => p.storagePath), ...photos.map((p) => p.url)]}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}

function AgentLightbox({ photos, index, onClose }: { photos: string[]; index: number; onClose: () => void }) {
  const [viewerIndex, setViewerIndex] = useState(index);
  const photoCount = photos.length;
  const step = (dir: number) => setViewerIndex((i) => (i + dir + photoCount) % photoCount);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
        <X className="size-6" />
      </button>
      {photoCount > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous photo" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20">
            <ChevronLeft className="size-6" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next photo" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20">
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
      <img src={photos[viewerIndex]} alt={`Photo ${viewerIndex + 1}`} className="max-h-[85vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
