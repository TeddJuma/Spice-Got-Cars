import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-brand-muted">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Inventory Admin</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Manage your dealership listings.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/create">
            <Button>
              <Plus className="mr-2 size-4" /> Add Listing
            </Button>
          </Link>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="mr-2 size-4" /> Logout
          </Button>
        </div>
      </div>

      <AdminListings />
    </div>
  );
}

function AdminListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("listed_at", { ascending: false });

      if (!error && data) {
        const withPhotos = await Promise.all(
          data.map(async (listing) => {
            const { data: photos } = await supabase
              .from("listing_photos")
              .select("storage_path")
              .eq("listing_id", listing.id)
              .order("sort_order", { ascending: true });
            return { ...listing, photos: photos?.map((p) => p.storage_path) || [] };
          })
        );
        setListings(withPhotos);
      }
      setLoading(false);
    };

    fetchListings();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (!error) {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
  };

  if (loading) {
    return <p className="mt-8 text-brand-muted">Loading listings...</p>;
  }

  if (listings.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <p className="text-brand-muted">No listings yet.</p>
        <Link to="/admin/create" className="mt-4 inline-block">
          <Button>Add your first listing</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-center gap-4">
            {listing.photos?.[0] && (
              <img
                src={listing.photos[0]}
                alt=""
                className="h-16 w-24 rounded-lg object-cover"
              />
            )}
            <div>
              <p className="font-semibold text-brand-navy">
                {listing.year} {listing.make} {listing.model}
              </p>
              <p className="text-sm text-brand-muted">
                {listing.status} - KES {listing.price_kes?.toLocaleString?.() ?? listing.price_kes}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/admin/${listing.id}`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 size-4" /> Edit
              </Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(listing.id)}>
              <Trash2 className="mr-1 size-4" /> Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
