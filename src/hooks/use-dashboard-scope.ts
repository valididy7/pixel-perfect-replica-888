import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { supabase } from "@/integrations/supabase/client";

export interface OwnerOption {
  user_id: string;
  display_name: string | null;
  username: string | null;
}

/**
 * Escopo do painel: cada usuário só vê os próprios anúncios.
 * Admin vê tudo por padrão e pode filtrar por dono no topo.
 *
 * Retorna `adIdSet`:
 *  - `null`  → sem filtro (admin vendo todo mundo)
 *  - `Set`   → só anúncios destes IDs (vazio = não mostra nada)
 */
export function useDashboardScope() {
  const { user } = useAuth();
  const { isAdmin, checking: adminChecking } = useIsAdmin();
  // "self" = meus anúncios | "all" (só admin) | userId específico (só admin)
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("self");
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [adIds, setAdIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega lista de donos pra dropdown (admin only).
  useEffect(() => {
    if (adminChecking || !user?.id || !isAdmin) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, username")
        .order("display_name", { ascending: true });
      if (!cancelled) setOwners((data ?? []) as OwnerOption[]);
    })();
    return () => { cancelled = true; };
  }, [isAdmin, adminChecking, user?.id]);

  // Não-admin é forçado a "self".
  const effectiveOwnerId = isAdmin ? selectedOwnerId : "self";

  useEffect(() => {
    if (!user?.id || adminChecking) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      if (isAdmin && effectiveOwnerId === "all") {
        if (!cancelled) { setAdIds(null); setLoading(false); }
        return;
      }
      const targetId = effectiveOwnerId === "self" ? user.id : effectiveOwnerId;
      const { data } = await supabase
        .from("ads")
        .select("id")
        .eq("owner_id", targetId);
      if (!cancelled) {
        setAdIds(((data ?? []) as { id: string }[]).map((r) => r.id));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, isAdmin, adminChecking, effectiveOwnerId]);

  const adIdSet = useMemo(() => (adIds === null ? null : new Set(adIds)), [adIds]);

  return {
    adIdSet,
    loading,
    isAdmin,
    owners,
    selectedOwnerId: effectiveOwnerId,
    setSelectedOwnerId,
    currentUserId: user?.id ?? null,
  };
}
