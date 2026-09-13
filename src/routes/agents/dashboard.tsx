import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAgentAuth } from "@/lib/agent-auth-context";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Image as ImageIcon, User } from "lucide-react";
import { getAgentListings, submitAgentPayment, updateAgentProfile } from "@/lib/agent-actions";
import { toast } from "sonner";

export const Route = createFileRoute("/agents/dashboard")({
  component: AgentDashboard,
});

function AgentDashboard() {
  const navigate = useNavigate();
  const { agent, loading, signOut } = useAgentAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdminChat, setShowAdminChat] = useState(false);
  const [mpesaRef, setMpesaRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", idNumber: "" });
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!loading && !agent) {
      navigate({ to: "/agents/login" });
    }
  }, [agent, loading, navigate]);

  const openProfile = async () => {
    setProfileLoading(true);
    setShowProfileModal(true);
    try {
      if (agent) {
        setProfileForm({
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          idNumber: agent.id_number,
        });
      }
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (!agent) return;
    const load = async () => {
      setLoadError(null);
      try {
        const res = await getAgentListings({ data: { agentId: agent.id } });
        if (res.error) {
          setLoadError(res.error.message);
        } else {
          setListings(res.listings || []);
        }
      } catch (err: any) {
        setLoadError(err?.message || "Failed to load listings");
      }
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
          <Button variant="outline" size="sm" onClick={openProfile}>
            <User className="mr-2 size-4" /> Profile
          </Button>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="mr-2 size-4" /> Logout
          </Button>
        </div>
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-brand-navy">Your Profile</h3>
            {profileLoading ? (
              <p className="mt-4 text-sm text-brand-muted">Loading...</p>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!agent) return;
                  setSubmittingProfile(true);
                  try {
                    const res = await updateAgentProfile({
                      data: {
                        email: agent.email,
                        name: profileForm.name,
                        phone: profileForm.phone,
                        idNumber: profileForm.idNumber,
                      },
                    });
                    if (res.error) {
                      toast.error(res.error.message || "Failed to update profile.");
                    } else {
                      toast.success("Profile updated successfully!");
                      setShowProfileModal(false);
                    }
                  } catch (err) {
                    toast.error("Failed to update profile.");
                  } finally {
                    setSubmittingProfile(false);
                  }
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="block text-sm font-medium text-brand-navy">Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-navy">Email</label>
                  <input
                    type="email"
                    required
                    disabled
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-navy">Phone number</label>
                  <input
                    type="tel"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-navy">ID number</label>
                  <input
                    type="text"
                    required
                    value={profileForm.idNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, idNumber: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    placeholder="12345678"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-brand-navy"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProfile}
                    className="flex-1 rounded-lg bg-brand-navy py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {submittingProfile ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {loadError && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-semibold">Notice</p>
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
                  <Link to="/agents/listings/$id" params={{ id: listing.id }}>
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
                  if (!mpesaRef.trim() || !agent) return;
                  setSubmittingPayment(true);
                  try {
                    const res = await submitAgentPayment({
                      data: {
                        agentId: agent.id,
                        mpesaRef: mpesaRef.trim(),
                      },
                    });
                    if (res.error) {
                      toast.error(res.error.message || "Failed to submit payment reference.");
                    } else {
                      toast.success("Payment reference submitted successfully!");
                      setPaymentSuccess(true);
                    }
                  } catch (err: any) {
                    toast.error(err?.message || "Failed to submit payment reference.");
                  } finally {
                    setSubmittingPayment(false);
                  }
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
