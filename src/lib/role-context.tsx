import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "./mock-data";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  role: Role;
  loading: boolean;
  setRole: (r: Role) => void; // demo override for non-signed-in browsing
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  role: "student",
  loading: true,
  setRole: () => {},
  signOut: async () => {},
  refreshRole: async () => {},
});

async function fetchRole(userId: string): Promise<Role> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .order("role", { ascending: true });
  if (!data || data.length === 0) return "student";
  // priority: admin > academic > industry > student
  const roles = data.map((r) => r.role as Role);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("academic")) return "academic";
  if (roles.includes("industry")) return "industry";
  return "student";
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("student");
  const [loading, setLoading] = useState(true);

  const refreshRole = async () => {
    if (!user) return;
    setRole(await fetchRole(user.id));
  };

  useEffect(() => {
    // Listener FIRST, then load existing session
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // defer DB call to avoid blocking the callback
        setTimeout(() => {
          fetchRole(s.user.id).then(setRole);
        }, 0);
      } else {
        setRole("student");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchRole(data.session.user.id).then(setRole).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, session, role, loading, setRole, signOut, refreshRole }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRole() {
  return useContext(Ctx);
}

export const useAuth = useRole;