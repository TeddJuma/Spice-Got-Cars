import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth-callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      window.location.href = "/admin";
    }
  }, [loading]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-brand-muted">Completing sign in...</p>
    </div>
  );
}
