import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Bell, Check, X, Search, Phone, MessageCircle, Trash } from "lucide-react";
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
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
});

type Tab = "listings" | "submissions" | "notifications";

function AdminIndexPage() {
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  const [listings, setListings] = useState<any[]>([]);
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

    const { data } = await supabase
      .from("listings")
      .select("*")
      .order("listed_at", { ascending: false });

    if (data) {
      const withPhotos = await Promise.all(
        data.map(async (listing: any) => {
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
    setLoading(false);
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
    }
  };

  const handleApprove = async (submission: SellSubmission) => {
    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
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
      })
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
      message: `Approved sell submission: ${submission.year} ${submission.make} ${submission.model}`,
    });

    toast.success("Submission approved and listed.");
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
        </div>
      </div>

      {activeTab === "listings" && (
        <div className="space-y-4">
          {filteredListings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-brand-muted">No listings match your search.</p>
            </div>
          ) : (
            filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-4">
                  {listing.photos?.[0] && (
                    <img src={listing.photos[0]} alt="" className="h-16 w-24 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="font-semibold text-brand-navy">
                      {listing.year} {listing.make} {listing.model}
                    </p>
                    <p className="text-sm text-brand-muted">
                      <Badge variant={listing.status === "available" ? "default" : "secondary"}>
                        {listing.status}
                      </Badge>{" "}
                      - KES {listing.price_kes?.toLocaleString?.() ?? listing.price_kes}
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
            ))
          )}
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-brand-muted">No sell submissions yet.</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-brand-navy">
                        {submission.year} {submission.make} {submission.model}
                      </p>
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
                    </div>
                    <p className="text-sm text-brand-muted">
                      Seller: {submission.name} | Phone: {submission.phone} | Location: {submission.location}
                    </p>
                    <p className="text-sm text-brand-muted">
                      Condition: {submission.condition} | Asking: KES {submission.asking_price.toLocaleString()}
                    </p>
                    {submission.notes && (
                      <p className="mt-1 text-sm text-brand-muted italic">"{submission.notes}"</p>
                    )}
                    {submission.photos.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {submission.photos.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt=""
                            className="h-20 w-28 shrink-0 rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {submission.status === "pending" && (
                    <div className="ml-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={`tel:${submission.phone}`}>
                          <Phone className="mr-1 size-4" /> Call
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a
                          href={`https://wa.me/${submission.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="mr-1 size-4" /> WhatsApp
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(submission)}
                      >
                        <Check className="mr-1 size-4" /> Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(submission.id)}
                      >
                        <X className="mr-1 size-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
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
              <div
                key={notification.id}
                className={`flex items-start justify-between rounded-xl border p-4 ${
                  notification.read
                    ? "border-slate-200 bg-white"
                    : "border-brand-accent bg-emerald-50"
                }`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p className="text-sm text-brand-navy">{notification.message}</p>
                  <p className="mt-1 text-xs text-brand-muted">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-4 text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteNotification(notification.id)}
                >
                  <Trash className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
