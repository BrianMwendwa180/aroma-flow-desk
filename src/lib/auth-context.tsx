import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isStaff: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null, loading: true, isStaff: false, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        setTimeout(() => { checkStaff(sess.user.id); }, 0);
      } else {
        setIsStaff(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) checkStaff(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function checkStaff(uid: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setIsStaff(!!data?.some((r) => r.role === "admin" || r.role === "staff"));
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, loading, isStaff, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
