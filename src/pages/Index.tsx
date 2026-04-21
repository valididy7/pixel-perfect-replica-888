import { Navigate } from "react-router-dom";
import { ADMIN_BASE } from "@/lib/admin-route";

/**
 * Rota pública "/" → manda direto pro painel admin.
 */
const Index = () => <Navigate to={ADMIN_BASE} replace />;

export default Index;
