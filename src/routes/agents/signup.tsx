import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAgentAuth } from "@/lib/agent-auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/agents/signup")({
  component: AgentSignupPage,
});

function AgentSignupPage() {
  const { signUp, agent, loading } = useAgentAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && agent) {
    redirect({ to: "/agents/dashboard" });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await signUp({ name, email, phone, idNumber, password });
    if (result.error) {
      setError(result.error.message);
    } else {
      toast.success("Account created! You can now sign in.");
      redirect({ to: "/agents/login" });
    }
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 md:py-20">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-brand-navy">Become an agent</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Create an agent account to sell cars on the SGC platform.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-navy">Full name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              placeholder="Jane Wanjiku"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-navy">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-navy">Phone number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              placeholder="+254 7XX XXX XXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-navy">ID number</label>
            <input
              type="text"
              required
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              placeholder="12345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-navy">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-brand-muted hover:text-brand-navy"
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
            {submitting ? "Please wait..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-brand-muted">
          Already have an account?{" "}
          <a href="/agents/login" className="font-semibold text-brand-accent hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
