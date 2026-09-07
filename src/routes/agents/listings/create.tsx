import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAgentAuth } from "@/lib/agent-auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/agents/listings/create")({
  component: AgentCreateListing,
});

function AgentCreateListing() {
  const { agent, loading } = useAgentAuth();
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);
  const [listingCount, setListingCount] = useState(0);

  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    priceKes: 0,
    negotiable: true,
    mileageKm: 0,
    transmission: "Automatic" as "Automatic" | "Manual",
    fuelType: "Petrol" as "Petrol" | "Diesel" | "Hybrid" | "Electric",
    engineSize: "",
    bodyType: "SUV" as "SUV" | "Saloon" | "Hatchback" | "Pickup" | "Wagon" | "Coupe",
    condition: "Foreign Used" as "New" | "Foreign Used" | "Locally Used",
    description: "",
    status: "available" as "available" | "reserved" | "sold",
    isAuction: false,
    location: "",
    locationPin: "",
  });

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!loading && !agent) {
      redirect({ to: "/agents/login" });
    }
  }, [agent, loading]);

  useEffect(() => {
    if (!agent) return;
    const load = async () => {
      const { count } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agent.id);
      setListingCount(count || 0);
    };
    load();
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;
    if (!agent.approved && listingCount >= 2) {
      toast.error("You have reached the limit of 2 listings. Activate your account to list more.");
      return;
    }
    setSubmitting(true);

    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        agent_id: agent.id,
        make: form.make,
        model: form.model,
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
        is_auction: form.isAuction,
        location: form.location || null,
        location_pin: form.locationPin || null,
        listed_at: new Date().toISOString().split("T")[0],
      })
      .select("*")
      .single();

    if (error || !listing) {
      toast.error("Failed to create listing.");
      setSubmitting(false);
      return;
    }

    toast.success("Listing created successfully!");
    redirect({ to: "/agents/dashboard" });
  };

  if (loading) return <p className="mx-auto max-w-5xl px-4 py-12 text-brand-muted">Loading...</p>;
  if (!agent) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold text-brand-navy md:text-3xl">Create listing</h1>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label>Make</Label>
            <Input value={form.make} onChange={(e) => updateField("make", e.target.value)} required />
          </div>
          <div>
            <Label>Model</Label>
            <Input value={form.model} onChange={(e) => updateField("model", e.target.value)} required />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label>Year</Label>
            <Input type="number" value={form.year} onChange={(e) => updateField("year", Number(e.target.value))} required />
          </div>
          <div>
            <Label>Price (KES)</Label>
            <Input type="number" value={form.priceKes} onChange={(e) => updateField("priceKes", Number(e.target.value))} required />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label>Mileage (km)</Label>
            <Input type="number" value={form.mileageKm} onChange={(e) => updateField("mileageKm", Number(e.target.value))} required />
          </div>
          <div>
            <Label>Condition</Label>
            <select
              value={form.condition}
              onChange={(e) => updateField("condition", e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="New">New</option>
              <option value="Foreign Used">Foreign Used</option>
              <option value="Locally Used">Locally Used</option>
            </select>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="min-h-24" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.negotiable} onCheckedChange={(v) => updateField("negotiable", v)} />
          <Label>Negotiable price</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.isAuction} onCheckedChange={(v) => updateField("isAuction", v)} />
          <Label>Auction listing</Label>
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creating..." : "Create listing"}
        </Button>
      </form>
    </div>
  );
}
