import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_BASE } from "@/lib/admin-route";

interface AdminGateProps {
  children: React.ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  // Só re-checa quando o ID do usuário muda. Evita "flash" do spinner
  // toda vez que outra aba dispara TOKEN_REFRESHED via localStorage
  // (que é o que dava sensação de "o painel recarregou junto").
  const userId = user?.id ?? null;

  useEffect(() => {
    let cancel = false;
    if (loading) return;
    if (!userId) { setIsAdmin(false); setChecking(false); return; }
    setChecking(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => { if (!cancel){ setIsAdmin(!!data); setChecking(false);} });
    return () => { cancel = true; };
  }, [userId, loading]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}