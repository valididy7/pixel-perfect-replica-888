import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { ADMIN_BASE } from "@/lib/admin-route";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    const from = location.pathname.startsWith(ADMIN_BASE) ? location.pathname : ADMIN_BASE;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  return <Outlet />;
}
