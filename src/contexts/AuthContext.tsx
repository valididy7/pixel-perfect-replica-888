import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener PRIMEIRO (evita race condition)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      const newUser = newSession?.user ?? null;
      // Só atualiza se o usuário REALMENTE mudou. Sem isso, eventos de
      // TOKEN_REFRESHED disparados por outra aba (login público recarregando)
      // forçariam re-render no painel — parecendo que ele recarrega junto.
      setUser((prev) => (prev?.id === newUser?.id ? prev : newUser));
      setSession((prev) => (prev?.user?.id === newUser?.id ? prev : newSession));
    });

    // Depois pega a sessão atual
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setUser(current?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Heartbeat: enquanto a aba estiver aberta+visível, marca last_seen_at no
  // profile do usuário logado a cada 30s. Admins veem isso na tela Usuários.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const ping = () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void supabase.rpc("touch_last_seen" as any);
    };
    ping();
    const id = setInterval(ping, 30_000);
    const onVis = () => ping();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
