import { createContext, useContext, useState, useEffect } from "react";
import { agentLogin } from "@/lib/agent-actions";

type Agent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  id_number: string;
  approved: boolean;
  approved_until: string | null;
  created_at: string;
};

type AgentAuthContextType = {
  agent: Agent | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: { message: string } | null }>;
  signUp: (data: { name: string; email: string; phone: string; idNumber: string; password: string }) => Promise<{ error: { message: string } | null }>;
  signOut: () => void;
};

const AgentAuthContext = createContext<AgentAuthContextType | null>(null);

export function AgentAuthProvider({ children }: { children: React.ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sgc_agent");
    if (stored) {
      try {
        setAgent(JSON.parse(stored));
      } catch {
        localStorage.removeItem("sgc_agent");
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (identifier: string, password: string) => {
    const result = await agentLogin(identifier, password);
    if (result.error) {
      return result;
    }
    if (result.success && result.agent) {
      const agentData = result.agent;
      setAgent(agentData);
      localStorage.setItem("sgc_agent", JSON.stringify(agentData));
      return { error: null };
    }
    return { error: { message: "Login failed" } };
  };

  const signUp = async (data: { name: string; email: string; phone: string; idNumber: string; password: string }) => {
    const supabase = (await import("@/lib/supabase-server")).createServerClient();
    if (!supabase) return { error: { message: "Supabase is not configured" } };

    const existingEmail = await supabase
      .from("agents")
      .select("id")
      .eq("email", data.email.toLowerCase().trim())
      .single();

    if (existingEmail.data) {
      return { error: { message: "An account with this email already exists" } };
    }

    const existingPhone = await supabase
      .from("agents")
      .select("id")
      .eq("phone", data.phone.trim())
      .single();

    if (existingPhone.data) {
      return { error: { message: "An account with this phone number already exists" } };
    }

    const existingId = await supabase
      .from("agents")
      .select("id")
      .eq("id_number", data.idNumber.trim())
      .single();

    if (existingId.data) {
      return { error: { message: "An account with this ID number already exists" } };
    }

    const passwordHash = await hashPassword(data.password);

    const { error } = await supabase.from("agents").insert({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      id_number: data.idNumber.trim(),
      password_hash: passwordHash,
    });

    if (error) {
      return { error: { message: error.message || "Failed to create account" } };
    }

    return { error: null };
  };

  const signOut = () => {
    setAgent(null);
    localStorage.removeItem("sgc_agent");
  };

  return (
    <AgentAuthContext.Provider value={{ agent, loading, signIn, signUp, signOut }}>
      {children}
    </AgentAuthContext.Provider>
  );
}

export function useAgentAuth() {
  const context = useContext(AgentAuthContext);
  if (!context) {
    throw new Error("useAgentAuth must be used within an AgentAuthProvider");
  }
  return context;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "sgc_agent_salt_2024");
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
