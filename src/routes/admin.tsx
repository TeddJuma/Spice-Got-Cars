import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchUnreadNotificationCount } from "@/data/sell-submissions";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Bell } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy md:text-3xl">Inventory Admin</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Manage your dealership listings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/create">
            <Button className="md:size-auto">
              <Plus className="mr-2 size-4" /> Add Listing
            </Button>
          </Link>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="mr-2 size-4" /> Logout
          </Button>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
