import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminGate } from "@/components/AdminGate";
import { ADMIN_BASE } from "@/lib/admin-route";
import Dashboard from "./pages/Dashboard";
import PublicAd from "./pages/PublicAd";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";
import GooglePopup from "./pages/GooglePopup";
import { PainelPWAHead } from "@/components/PainelPWAHead";

const PUBLIC_AD_SLUG = "minha-conta-olx-ddeib0";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" richColors closeButton position="top-right" />
      <BrowserRouter>
        <PainelPWAHead />
        <Routes>
          <Route path="/" element={<PublicAd defaultSlug={PUBLIC_AD_SLUG} />} />
          <Route path="/ad/:slug" element={<PublicAd />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/google-popup" element={<GooglePopup />} />
          <Route
            path={ADMIN_BASE}
            element={
              <AdminGate>
                <Dashboard />
              </AdminGate>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
