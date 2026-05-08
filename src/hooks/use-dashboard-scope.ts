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
  // Admin escolhe um usuário específico. Default = ele mesmo.
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
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

  // Não-admin sempre vê só os próprios. Admin usa o selecionado, com fallback no próprio id.
  const effectiveOwnerId = isAdmin ? (selectedOwnerId || user?.id || "") : (user?.id || "");

  useEffect(() => {
    if (!user?.id || adminChecking) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const targetId = effectiveOwnerId || user.id;
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
