import { createContext, useContext, useState, useEffect } from "react";
import { agentLogin, agentSignUp, getAgentProfile } from "@/lib/agent-actions";

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
  signIn: (payload: { identifier: string; password: string }) => Promise<{ error: { message: string } | null }>;
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
        const parsed = JSON.parse(stored);
        setAgent(parsed);
        if (parsed.email) {
          getAgentProfile({ data: { email: parsed.email } }).then((result) => {
            if (result.success && result.agent) {
              setAgent(result.agent);
              localStorage.setItem("sgc_agent", JSON.stringify(result.agent));
            }
          });
        }
      } catch {
        localStorage.removeItem("sgc_agent");
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (payload: {
    identifier: string;
    password: string;
  }) => {
    const result = await agentLogin({ data: payload });
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

  const signUp = async (data: {
    name: string;
    email: string;
    phone: string;
    idNumber: string;
    password: string;
  }) => {
    const result = await agentSignUp({ data });
    if (result.error) {
      return result;
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
