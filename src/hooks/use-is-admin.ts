import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/** Retorna true se o usuário logado tem role admin. */
export function useIsAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancel = false;
    if (loading) return;
    if (!user?.id) { setIsAdmin(false); setChecking(false); return; }
    setChecking(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => { if (!cancel) { setIsAdmin(!!data); setChecking(false); } });
    return () => { cancel = true; };
  }, [user?.id, loading]);

  return { isAdmin, checking };
}
