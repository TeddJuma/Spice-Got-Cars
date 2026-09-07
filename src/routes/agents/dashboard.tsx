import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAgentAuth } from "@/lib/agent-auth-context";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/agents/dashboard")({
  component: AgentDashboard,
});

function AgentDashboard() {
  const { agent, loading, signOut } = useAgentAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [mpesaRef, setMpesaRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!loading && !agent) {
      redirect({ to: "/agents/login" });
    }
  }, [agent, loading]);

  useEffect(() => {
    if (!agent) return;
    const load = async () => {
      setLoadError(null);
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("agent_id", agent.id)
        .order("listed_at", { ascending: false });

      if (error) {
        setLoadError(error.message);
        return;
      }

      const withPhotos = await Promise.all(
        (data || []).map(async (listing: any) => {
          const { data: photos } = await supabase
            .from("listing_photos")
            .select("storage_path")
            .eq("listing_id", listing.id)
            .order("sort_order", { ascending: true });
          return { ...listing, photos: photos?.map((p: any) => p.storage_path) || [] };
        }),
      );
      setListings(withPhotos);
    };
    load();
  }, [agent]);

  if (loading) {
    return <p className="mx-auto max-w-5xl px-4 py-12 text-brand-muted">Loading...</p>;
  }

  if (!agent) return null;

  const daysLeft = agent.approved_until
    ? Math.max(0, Math.ceil((new Date(agent.approved_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy md:text-3xl">Agent Dashboard</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Welcome, {agent.name}. Manage your listings here.
          </p>
          <div className="mt-2">
            {agent.approved ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                Active · {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  Not active · limited to 2 listings
                </span>
                <Button size="sm" onClick={() => setShowActivateModal(true)}>
                  Activate account
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/agents/listings/create">
            <Button className="md:size-auto">
              <Plus className="mr-2 size-4" /> Add Listing
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="mr-2 size-4" /> Logout
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Error loading listings</p>
          <p className="mt-1 text-sm">{loadError}</p>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-brand-muted">No listings yet. Create your first listing to get started.</p>
          </div>
        ) : (
          listings.map((listing) => (
            <div key={listing.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-4 p-4">
                {listing.photos?.[0] ? (
                  <img src={listing.photos[0]} alt="" className="size-16 rounded-lg object-cover" />
                ) : (
                  <div className="grid size-16 place-items-center rounded-lg bg-slate-100 text-brand-muted">
                    <ImageIcon className="size-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-brand-navy">
                    {listing.year} {listing.make} {listing.model}
                  </p>
                  <p className="truncate text-sm text-brand-muted">
                    {listing.status} · {listing.is_auction ? "Auction" : "Standard"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/agents/listings/${listing.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showActivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-brand-navy">Activate your account</h3>
            {paymentSuccess ? (
              <div className="mt-4 text-center">
                <p className="text-sm text-brand-muted">Submission Received. The Spice Got Cars team will review your details, and contact you about the next steps. Verification may take up to 48 hours.</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowActivateModal(false);
                    setPaymentSuccess(false);
                    setMpesaRef("");
                  }}
                  className="mt-4 rounded-lg bg-brand-navy px-4 py-2 text-sm font-bold text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-brand-navy">Activation fee: KES 2,000 for 30 days</p>
                  <p className="mt-2 font-semibold text-brand-navy">Mobile Money Paybill: 714888</p>
                  <p className="font-semibold text-brand-navy">Account Number: 134394</p>
                  <p className="font-semibold text-brand-navy">Business Name: Spice Got Cars</p>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!mpesaRef.trim()) return;
                  setSubmittingPayment(true);
                  const { error } = await supabase.from("agent_payments").insert({
                    agent_id: agent!.id,
                    mpesa_ref: mpesaRef.trim(),
                    amount: 2000,
                    status: "pending",
                  });
                  if (error) {
                    toast.error("Failed to submit payment reference.");
                  } else {
                    setPaymentSuccess(true);
                  }
                  setSubmittingPayment(false);
                }} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-brand-navy">M-PESA Reference Code</label>
                    <input
                      type="text"
                      required
                      value={mpesaRef}
                      onChange={(e) => setMpesaRef(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                      placeholder="e.g. SFE123456789"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowActivateModal(false)}
                      className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-brand-navy"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPayment}
                      className="flex-1 rounded-lg bg-brand-navy py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {submittingPayment ? "Submitting..." : "Submit payment"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
