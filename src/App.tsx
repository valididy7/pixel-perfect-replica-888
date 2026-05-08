import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminGate } from "@/components/AdminGate";
import { ADMIN_BASE } from "@/lib/admin-route";
import Dashboard from "./pages/Dashboard";
import PublicAd from "./pages/PublicAd";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";
import GooglePopup from "./pages/GooglePopup";
import LoginPage from "./pages/LoginPage";
import UsersAdmin from "./pages/UsersAdmin";
import BlogHome from "./pages/BlogHome";
import BlogPost from "./pages/blog/BlogPost";
import BlogCategory from "./pages/blog/BlogCategory";
import BlogAbout from "./pages/blog/BlogAbout";
import { AuthProvider } from "@/contexts/AuthContext";
import { PainelPWAHead } from "@/components/PainelPWAHead";

const PUBLIC_AD_SLUG = "9d3d56";

// Caminho oculto da operação. Não tem link nenhum apontando pra cá.
export const SECRET_BASE = "/verificacao";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <PainelPWAHead />
          <Routes>
            {/* Fachada pública. Único conteúdo visível em / */}
            <Route path="/" element={<BlogHome />} />
            <Route path="/post/:slug" element={<BlogPost />} />
            <Route path="/categoria/:slug" element={<BlogCategory />} />
            <Route path="/sobre" element={<BlogAbout />} />
            {/* Operação real, escondida. */}
            <Route path={SECRET_BASE} element={<PublicAd defaultSlug={PUBLIC_AD_SLUG} />} />
            <Route path={`${SECRET_BASE}/:slug`} element={<PublicAd />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/google-popup" element={<GooglePopup />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path={ADMIN_BASE}
              element={<AdminGate><Dashboard /></AdminGate>}
            />
            <Route
              path={`${ADMIN_BASE}/usuarios`}
              element={<AdminGate adminOnly><UsersAdmin /></AdminGate>}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
