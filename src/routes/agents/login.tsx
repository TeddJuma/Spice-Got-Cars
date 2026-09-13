import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAgentAuth } from "@/lib/agent-auth-context";

export const Route = createFileRoute("/agents/login")({
  component: AgentLoginPage,
});

function AgentLoginPage() {
  const navigate = useNavigate();
  const { signIn, agent, loading } = useAgentAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && agent) {
      navigate({ to: "/agents/dashboard" });
    }
  }, [agent, loading, navigate]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await signIn({ identifier, password });
      if (result.error) {
        setError(result.error.message);
      } else {
        navigate({ to: "/agents/dashboard" });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 md:py-20">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-brand-navy">Agent login</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Sign in to manage your listings on the SGC platform.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-navy">Email, phone, or ID number</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              placeholder="you@example.com / +254 7XX XXX XXX / ID number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-navy">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 z-10 flex items-center px-3 text-sm text-brand-muted hover:text-brand-navy"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-navy py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Please wait..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-brand-muted">
          Don't have an account?{" "}
          <Link to="/agents/signup" className="font-semibold text-brand-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
