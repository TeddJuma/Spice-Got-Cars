import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
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
import { ArrowLeft, Upload, X } from "lucide-react";

export const Route = createFileRoute("/admin/create")({
  component: CreateListingPage,
});

function CreateListingPage() {
  const { user, loading } = useAuth();
  const supabase = createClient();

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
    ntsaInspected: false,
    logbookVerified: false,
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
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
    setPhotos((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPhotoUrls((prev) => [...prev, ...urls]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadPhotos = async (listingId: string): Promise<string[]> => {
    const uploadedPaths: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user!.id}/${listingId}/${Date.now()}-${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("car-photos")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("car-photos")
        .getPublicUrl(path);

      uploadedPaths.push(publicUrlData.publicUrl);

      await supabase.from("listing_photos").insert({
        listing_id: listingId,
        storage_path: publicUrlData.publicUrl,
        sort_order: i,
      });
    }
    return uploadedPaths;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { data: listing, error: insertError } = await supabase
        .from("listings")
        .insert({
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
          listed_at: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (photos.length > 0 && listing) {
        await uploadPhotos(listing.id);
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
      <Link to="/admin" className="inline-flex items-center text-sm text-brand-muted hover:text-brand-navy">
        <ArrowLeft className="mr-1 size-4" /> Back to admin
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-brand-navy">Add new listing</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Make</Label>
            <Input required value={form.make} onChange={(e) => updateField("make", e.target.value)} />
          </div>
          <div>
            <Label>Model</Label>
            <Input required value={form.model} onChange={(e) => updateField("model", e.target.value)} />
          </div>
          <div>
            <Label>Trim</Label>
            <Input value={form.trim} onChange={(e) => updateField("trim", e.target.value)} />
          </div>
          <div>
            <Label>Year</Label>
            <Input type="number" required value={form.year} onChange={(e) => updateField("year", parseInt(e.target.value))} />
          </div>
          <div>
            <Label>Price (KES)</Label>
            <Input type="number" required value={form.priceKes} onChange={(e) => updateField("priceKes", parseInt(e.target.value))} />
          </div>
          <div>
            <Label>Mileage (km)</Label>
            <Input type="number" required value={form.mileageKm} onChange={(e) => updateField("mileageKm", parseInt(e.target.value))} />
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
            <Input value={form.fuelType} onChange={(e) => updateField("fuelType", e.target.value)} />
          </div>
          <div>
            <Label>Engine Size</Label>
            <Input required value={form.engineSize} onChange={(e) => updateField("engineSize", e.target.value)} />
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
          <Textarea required value={form.description} onChange={(e) => updateField("description", e.target.value)} />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={form.negotiable} onCheckedChange={(v) => updateField("negotiable", v)} />
            <Label className="!mt-0">Negotiable price</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.ntsaInspected} onCheckedChange={(v) => updateField("ntsaInspected", v)} />
            <Label className="!mt-0">NTSA inspected</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.logbookVerified} onCheckedChange={(v) => updateField("logbookVerified", v)} />
            <Label className="!mt-0">Logbook verified</Label>
          </div>
        </div>

        <div>
          <Label>Photos</Label>
          <div className="mt-2">
            <Input type="file" accept="image/*" multiple onChange={handlePhotoChange} />
          </div>
          {photoUrls.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {photoUrls.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="h-24 w-32 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creating..." : "Create Listing"}
        </Button>
      </form>
    </div>
  );
}
