import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Bell, Check, X, Search, Phone, MessageCircle, Trash, ChevronDown, ChevronLeft, ChevronRight, Image as ImageIcon, Gavel } from "lucide-react";
import {
  fetchSellSubmissions,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  updateSellSubmissionStatus,
} from "@/data/sell-submissions";
import type { SellSubmission, Notification } from "@/data/sell-submissions";
import { listings as demoListings } from "@/data/listings";
import { auctionItems as demoAuctions } from "@/data/auctions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
});

type Tab = "listings" | "auctions" | "submissions" | "notifications";

function AdminIndexPage() {
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  const [listings, setListings] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<SellSubmission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    const [submissionsData, notificationsData, unread] = await Promise.all([
      fetchSellSubmissions(supabase),
      fetchNotifications(supabase),
      fetchUnreadNotificationCount(supabase),
    ]);

    setSubmissions(submissionsData);
    setNotifications(notificationsData);
    setUnreadCount(unread);

    const { data: listingsData } = await supabase
      .from("listings")
      .select("*")
      .eq("is_auction", false)
      .order("listed_at", { ascending: false });

    if (listingsData) {
      const withPhotos = await Promise.all(
        listingsData.map(async (listing: any) => {
          const { data: photos } = await supabase
            .from("listing_photos")
            .select("storage_path")
            .eq("listing_id", listing.id)
            .order("sort_order", { ascending: true });
          return { ...listing, photos: photos?.map((p: any) => p.storage_path) || [] };
        }),
      );
      setListings(withPhotos);
    }

    const { data: auctionsData } = await supabase
      .from("listings")
      .select("*")
      .eq("is_auction", true)
      .order("auction_ends_at", { ascending: true });

    if (auctionsData) {
      const withPhotos = await Promise.all(
        auctionsData.map(async (listing: any) => {
          const { data: photos } = await supabase
            .from("listing_photos")
            .select("storage_path")
            .eq("listing_id", listing.id)
            .order("sort_order", { ascending: true });
          return { ...listing, photos: photos?.map((p: any) => p.storage_path) || [] };
        }),
      );
      setAuctions(withPhotos);
    }

    setLoading(false);
  };

  const seedDemoData = async () => {
    if (!confirm("This will insert demo listings and auctions into your database. Continue?")) return;
    setLoading(true);

    for (const car of demoListings) {
      const { error } = await supabase
        .from("listings")
        .insert({
          make: car.make,
          model: car.model,
          trim: car.trim || null,
          year: car.year,
          price_kes: car.priceKes,
          negotiable: car.negotiable,
          mileage_km: car.mileageKm,
          transmission: car.transmission,
          fuel_type: car.fuelType,
          engine_size: car.engineSize,
          body_type: car.bodyType,
          condition: car.condition,
          description: car.description,
          status: car.status,
          ntsa_inspected: car.ntsaInspected,
          logbook_verified: car.logbookVerified,
          listed_at: car.listedAt,
          is_auction: false,
        });

      if (error) {
        console.error("Failed to insert listing:", car.id, error);
      }
    }

    for (const item of demoAuctions) {
      const { error } = await supabase
        .from("listings")
        .insert({
          make: item.make,
          model: item.model,
          trim: item.trim || null,
          year: item.year,
          price_kes: item.startingBidKes,
          negotiable: item.negotiable,
          mileage_km: item.mileageKm,
          transmission: item.transmission,
          fuel_type: item.fuelType,
          engine_size: item.engineSize,
          body_type: item.bodyType,
          condition: item.condition,
          description: item.description,
          status: item.status === "ended" ? "available" : item.status === "sold" ? "sold" : "available",
          ntsa_inspected: item.ntsaInspected,
          logbook_verified: item.logbookVerified,
          listed_at: new Date().toISOString().split("T")[0],
          is_auction: true,
          auction_ends_at: item.endsAt,
          starting_bid_kes: item.startingBidKes,
          current_bid_kes: item.currentBidKes,
          bid_count: item.bidCount,
          highest_bidder: item.highestBidder || null,
        });

      if (error) {
        console.error("Failed to insert auction:", item.id, error);
      }
    }

    toast.success("Demo data imported!");
    loadData();
  };

  useEffect(() => {
    loadData();
  }, [supabase]);

  useEffect(() => {
    if (activeTab === "notifications") {
      markAllNotificationsAsRead(supabase).then(() => {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      });
    }
  }, [activeTab, supabase]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (!error) {
      setListings((prev) => prev.filter((l) => l.id !== id));
      setAuctions((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const handleApprove = async (submission: SellSubmission, asAuction = false) => {
    const insertData: any = {
      make: submission.make,
      model: submission.model,
      year: submission.year,
      price_kes: submission.asking_price,
      negotiable: false,
      mileage_km: submission.mileage_km,
      transmission: "Automatic",
      fuel_type: "Petrol",
      engine_size: "Unknown",
      body_type: "Other",
      condition: submission.condition,
      description: submission.notes || `Customer submission: ${submission.make} ${submission.model}`,
      status: "available",
      ntsa_inspected: false,
      logbook_verified: false,
      listed_at: new Date().toISOString().split("T")[0],
      is_auction: asAuction,
    };

    if (asAuction) {
      insertData.auction_ends_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      insertData.starting_bid_kes = submission.asking_price;
      insertData.current_bid_kes = submission.asking_price;
      insertData.bid_count = 0;
    }

    const { data: listing, error } = await supabase
      .from("listings")
      .insert(insertData)
      .select("*")
      .single();

    if (error || !listing) {
      alert("Failed to create listing from submission.");
      return;
    }

    if (submission.photos.length > 0) {
      const photoRecords = submission.photos.map((url, idx) => ({
        listing_id: listing.id,
        storage_path: url,
        sort_order: idx + 1,
      }));
      await supabase.from("listing_photos").insert(photoRecords);
    }

    await updateSellSubmissionStatus(submission.id, "approved", supabase);
    await supabase.from("notifications").insert({
      type: "submission_approved",
      message: `Approved sell submission: ${submission.year} ${submission.make} ${submission.model}${asAuction ? " (Auction)" : ""}`,
    });

    toast.success(asAuction ? "Submission approved as auction listing." : "Submission approved and listed.");
    loadData();
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this submission?")) return;
    await updateSellSubmissionStatus(id, "rejected", supabase);
    toast.success("Submission rejected.");
    loadData();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(supabase);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id, supabase);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    const success = await deleteNotification(id, supabase);
    if (success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted.");
    }
  };

  const query = searchQuery.toLowerCase().trim();

  const filteredListings = listings.filter((l) => {
    if (!query) return true;
    return `${l.year} ${l.make} ${l.model} ${l.status}`
      .toLowerCase()
      .includes(query);
  });

  const filteredSubmissions = submissions
    .filter((s) => s.status === "pending")
    .filter((s) => {
      if (!query) return true;
      return `${s.year} ${s.make} ${s.model} ${s.status} ${s.name}`
        .toLowerCase()
        .includes(query);
    });

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  if (loading) {
    return <p className="mt-8 text-brand-muted">Loading...</p>;
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "listings" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("listings")}
          >
            Approved Listings ({listings.length})
          </Button>
          <Button
            variant={activeTab === "auctions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("auctions")}
          >
            Auctions ({auctions.length})
          </Button>
          <Button
            variant={activeTab === "submissions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("submissions")}
            className="relative"
          >
            Pending Submissions
            {pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {pendingCount}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "notifications" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("notifications")}
            className="relative"
          >
            <Bell className="mr-1 size-4" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            />
          </div>
          {activeTab === "notifications" && unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={seedDemoData}>
            Seed demo data
          </Button>
        </div>
      </div>

      {activeTab === "listings" && (
        <div className="space-y-3">
          {filteredListings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-brand-muted">No listings match your search.</p>
            </div>
          ) : (
            filteredListings.map((listing) => (
              <AdminListingCard
                key={listing.id}
                listing={listing}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "auctions" && (
        <div className="space-y-3">
          {auctions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-brand-muted">No auction listings yet.</p>
            </div>
          ) : (
            auctions.map((listing) => (
              <AdminListingCard
                key={listing.id}
                listing={listing}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="space-y-3">
          {filteredSubmissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-brand-muted">No sell submissions yet.</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-brand-muted">No notifications.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <AdminNotificationCard
                key={notification.id}
                notification={notification}
                onOpen={handleNotificationClick}
                onDelete={handleDeleteNotification}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SubmissionCard({
  submission,
  onApprove,
  onReject,
}: {
  submission: SellSubmission;
  onApprove: (s: SellSubmission) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const photos = submission.photos;
  const photoCount = photos.length;

  const closeViewer = () => setViewerIndex(null);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50"
      >
        {submission.photos[0] ? (
          <img
            src={submission.photos[0]}
            alt=""
            className="size-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-slate-100 text-brand-muted">
            <ImageIcon className="size-6" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-brand-navy">
            {submission.year} {submission.make} {submission.model}
          </p>
          <p className="truncate text-sm text-brand-muted">
            {submission.name} · {submission.phone}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Badge
            variant={
              submission.status === "pending"
                ? "destructive"
                : submission.status === "approved"
                  ? "default"
                  : "secondary"
            }
          >
            {submission.status}
          </Badge>
          {photoCount > 0 && (
            <span className="hidden text-xs text-brand-muted sm:inline">
              {photoCount} photo{photoCount > 1 ? "s" : ""}
            </span>
          )}
          <ChevronDown
            className={`size-5 text-brand-muted transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Seller" value={submission.name} />
            <Detail label="Phone" value={submission.phone} />
            <Detail label="Location" value={submission.location} />
            <Detail label="Condition" value={submission.condition} />
            <Detail label="Year" value={String(submission.year)} />
            <Detail label="Mileage" value={`${submission.mileage_km.toLocaleString()} km`} />
            <Detail
              label="Engine capacity"
              value={
                submission.engine_capacity != null
                  ? `${submission.engine_capacity.toLocaleString()} cc`
                  : "—"
              }
            />
            <Detail
              label="Asking price"
              value={`KES ${submission.asking_price.toLocaleString()}`}
            />
            <Detail label="Status" value={submission.status} />
          </dl>

          {submission.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Notes
              </p>
              <p className="mt-1 text-sm italic text-brand-muted">
                "{submission.notes}"
              </p>
            </div>
          )}

          {photoCount > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Photos
              </p>
              <div className="flex flex-wrap gap-2">
                {photos.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setViewerIndex(idx)}
                    className="overflow-hidden rounded-lg border border-slate-200 transition hover:ring-2 hover:ring-brand-accent"
                  >
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="h-24 w-32 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {submission.status === "pending" && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${submission.phone}`}>
                  <Phone className="mr-1 size-4" /> Call
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`https://wa.me/${submission.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-1 size-4" /> WhatsApp
                </a>
              </Button>
              <Button size="sm" onClick={() => onApprove(submission, false)}>
                <Check className="mr-1 size-4" /> Approve as Listing
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onApprove(submission, true)}
              >
                <Gavel className="mr-1 size-4" /> Send to Auction
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onReject(submission.id)}
              >
                <X className="mr-1 size-4" /> Reject
              </Button>
            </div>
          )}
        </div>
      )}

      {viewerIndex !== null && photos[viewerIndex] && (
        <Lightbox photos={photos} index={viewerIndex} onClose={closeViewer} />
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-brand-navy">
        {value}
      </dd>
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
      )}
      <img
        src={photos[viewerIndex]}
        alt={`Photo ${viewerIndex + 1}`}
        className="max-h-[85vh] max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {photoCount > 1 && (
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
      )}
    </div>
  );
}

function AdminListingCard({
  listing,
  onDelete,
}: {
  listing: any;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const photos: string[] = listing.photos ?? [];
  const price =
    listing.price_kes != null
      ? `KES ${Number(listing.price_kes).toLocaleString()}`
      : "—";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50"
      >
        {photos[0] ? (
          <img
            src={photos[0]}
            alt=""
            className="size-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-slate-100 text-brand-muted">
            <ImageIcon className="size-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-brand-navy">
            {listing.year} {listing.make} {listing.model}
            {listing.trim ? (
              <span className="text-brand-muted"> {listing.trim}</span>
            ) : null}
          </p>
          <p className="truncate text-sm text-brand-muted">
            {price} · {listing.transmission} · {listing.body_type}
            {listing.is_auction && " · Auction"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Badge
            variant={listing.status === "available" ? "default" : "secondary"}
          >
            {listing.status}
          </Badge>
          {listing.is_auction && (
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              Auction
            </Badge>
          )}
          <ChevronDown
            className={`size-5 text-brand-muted transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Make" value={listing.make ?? "—"} />
            <Detail label="Model" value={listing.model ?? "—"} />
            <Detail label="Trim" value={listing.trim || "—"} />
            <Detail label="Year" value={String(listing.year)} />
            <Detail label="Price" value={price} />
            <Detail label="Status" value={listing.status} />
            <Detail
              label="Mileage"
              value={
                listing.mileage_km != null
                  ? `${Number(listing.mileage_km).toLocaleString()} km`
                  : "—"
              }
            />
            <Detail label="Transmission" value={listing.transmission} />
            <Detail label="Fuel" value={listing.fuel_type} />
            <Detail label="Engine" value={listing.engine_size} />
            <Detail label="Body type" value={listing.body_type} />
            <Detail label="Condition" value={listing.condition} />
            <Detail label="Listed" value={String(listing.listed_at)} />
            {listing.is_auction && (
              <Detail
                label="Bid Ends By"
                value={
                  listing.auction_ends_at
                    ? new Date(listing.auction_ends_at).toLocaleString()
                    : "—"
                }
              />
            )}
          </dl>

          {listing.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Description
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                {listing.description}
              </p>
            </div>
          )}

          {photos.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Photos
              </p>
              <div className="flex flex-wrap gap-2">
                {photos.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setViewerIndex(idx)}
                    className="overflow-hidden rounded-lg border border-slate-200 transition hover:ring-2 hover:ring-brand-accent"
                  >
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="h-24 w-32 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Button size="sm" variant="outline" asChild>
              <Link to={`/admin/${listing.id}`}>
                <Pencil className="mr-1 size-4" /> Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(listing.id)}
            >
              <Trash2 className="mr-1 size-4" /> Delete
            </Button>
          </div>
        </div>
      )}

      {viewerIndex !== null && photos[viewerIndex] && (
        <Lightbox
          photos={photos}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}

function AdminNotificationCard({
  notification,
  onOpen,
  onDelete,
}: {
  notification: Notification;
  onOpen: (n: Notification) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white ${
        notification.read ? "border-slate-200" : "border-brand-accent"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (!notification.read) onOpen(notification);
          setExpanded((e) => !e);
        }}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex min-w-0 items-center gap-3">
          {!notification.read && (
            <span
              className="size-2 shrink-0 rounded-full bg-brand-accent"
              aria-label="Unread"
            />
          )}
          <p className="truncate text-sm text-brand-navy">
            {notification.message}
          </p>
        </div>
        <ChevronDown
          className={`size-5 shrink-0 text-brand-muted transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="flex items-start justify-between gap-4 border-t border-slate-100 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Received
            </p>
            <p className="mt-0.5 text-sm text-brand-navy">
              {new Date(notification.created_at).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-brand-muted">
              Type: {notification.type}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-red-600 hover:text-red-700"
            onClick={() => onDelete(notification.id)}
          >
            <Trash className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
