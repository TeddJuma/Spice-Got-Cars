import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAgentAuth } from "@/lib/agent-auth-context";
import {
  createAgentListing,
  uploadAgentListingPhotos,
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
import { ArrowLeft, Upload, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agents/listings/create")({
  component: AgentCreateListing,
});

type PhotoItem = { kind: "new"; file: File; url: string };

function AgentCreateListing() {
  const { agent, loading } = useAgentAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    make: "",
    model: "",
    trim: "",
    year: new Date().getFullYear(),
    priceKes: 0,
    negotiable: false,
    mileageKm: 0,
    transmission: "Automatic" as "Automatic" | "Manual",
    fuelType: "Petrol",
    engineSize: "",
    bodyType: "SUV" as "SUV" | "Saloon" | "Hatchback" | "Pickup" | "Wagon" | "Coupe",
    condition: "Foreign Used" as "New" | "Foreign Used" | "Locally Used",
    description: "",
    status: "available" as "available" | "reserved" | "sold",
    logbookVerified: false,
    isAuction: false,
    location: "",
    locationPin: "",
    auctionWindows: [] as Array<{ startsAt: string; endsAt: string }>,
  });

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !agent) {
      navigate({ to: "/agents/login" });
    }
  }, [agent, loading, navigate]);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
    if (viewerIndex === index) setViewerIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!agent) return;

      const res = await createAgentListing({
        data: {
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

      if (res.error || !res.listing) {
        toast.error(res.error?.message || "Failed to create listing.");
        setSubmitting(false);
        return;
      }

      const listingId = res.listing.id;

      if (photos.length > 0) {
        const base64Photos = await Promise.all(
          photos.map(async (p) => {
            return new Promise<{ name: string; type: string; base64: string }>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  name: p.file.name,
                  type: p.file.type,
                  base64: (reader.result as string).split(",")[1] || "",
                });
              };
              reader.readAsDataURL(p.file);
            });
          }),
        );

        const uploadRes = await uploadAgentListingPhotos({
          data: { listingId, agentId: agent.id, photos: base64Photos },
        });

        if (uploadRes.error) {
          toast.error(uploadRes.error.message || "Some photo uploads failed.");
        }
      }

      if (form.isAuction && form.auctionWindows.length > 0) {
        const validWindows = form.auctionWindows.filter((w) => w.startsAt && w.endsAt);
        if (validWindows.length > 0) {
          const winRes = await updateAuctionWindows({
            data: { listingId, agentId: agent.id, windows: validWindows },
          });
          if (winRes.error) {
            toast.error(winRes.error.message || "Failed to set auction windows.");
          }
        }
      }

      toast.success("Listing created successfully!");
      navigate({ to: "/agents/dashboard" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to create listing.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="mx-auto max-w-5xl px-4 py-12 text-brand-muted">Loading...</p>;
  }
  if (!agent) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Link
        to="/agents/dashboard"
        className="inline-flex items-center text-sm text-brand-muted hover:text-brand-navy"
      >
        <ArrowLeft className="mr-1 size-4" /> Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-brand-navy md:text-3xl">Add new listing</h1>

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
                <button type="button" onClick={() => updateField("auctionWindows", form.auctionWindows.filter((_, i) => i !== index))} className="mt-5 rounded-lg p-2 text-red-600 hover:bg-red-50">
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
          <div className="mt-2">
            <Input type="file" accept="image/*" multiple onChange={handlePhotoChange} />
          </div>
          {photos.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <button type="button" key={i} onClick={() => setViewerIndex(i)} className="relative overflow-hidden rounded-lg border border-slate-200 transition hover:ring-2 hover:ring-brand-accent">
                  <img src={photo.url} alt="" className="h-24 w-32 object-cover" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); removePhoto(i); }} className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white">
                    <X className="size-3" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creating..." : "Create Listing"}
        </Button>
      </form>

      {viewerIndex !== null && photos[viewerIndex] && (
        <Lightbox photos={photos.map((p) => p.url)} index={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </div>
  );
}

function Lightbox({ photos, index, onClose }: { photos: string[]; index: number; onClose: () => void }) {
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
