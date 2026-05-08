import { FormEvent, useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { ADMIN_BASE, ADMIN_LOGIN_PATH } from "@/lib/admin-route";
import loginBg from "@/assets/login-bg.jpg";

const OLX_ICON = "https://www.olx.com.br/favicon.ico";
const OLX_TITLE = "OLX - A maior plataforma de compra e venda do Brasil";
let savedTabState: { title: string; icons: HTMLLinkElement[] } | null = null;

function applyOlxDisguise() {
  if (savedTabState) return; // já aplicado
  const icons = Array.from(
    document.querySelectorAll<HTMLLinkElement>(
      "link[rel~='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
    )
  );
  savedTabState = { title: document.title, icons };
  icons.forEach((el) => el.parentNode?.removeChild(el));
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/x-icon";
  link.href = OLX_ICON;
  link.dataset.disguise = "olx";
  document.head.appendChild(link);
  document.title = OLX_TITLE;
}

function restoreOriginalTab() {
  if (!savedTabState) return;
  document
    .querySelectorAll("link[data-disguise='olx']")
    .forEach((el) => el.parentNode?.removeChild(el));
  savedTabState.icons.forEach((el) => document.head.appendChild(el));
  document.title = savedTabState.title;
  savedTabState = null;
}

// Heurística simples anti-bot: se o user-agent bate com crawlers conhecidos,
// ou se o ambiente parece headless (webdriver/sem plugins/sem idioma),
// mandamos pra home pública pra ele não indexar nem mexer no login.
function looksLikeBot(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = (navigator.userAgent || "").toLowerCase();
  if (!ua) return true;
  const botPatterns = [
    "googlebot", "google-inspectiontool", "bingbot", "slurp", "duckduckbot",
    "baiduspider", "yandex", "sogou", "exabot", "facebookexternalhit",
    "facebot", "ia_archiver", "twitterbot", "linkedinbot", "embedly",
    "quora link preview", "showyoubot", "outbrain", "pinterest", "slackbot",
    "vkshare", "w3c_validator", "redditbot", "applebot", "whatsapp",
    "telegrambot", "discordbot", "petalbot", "semrushbot", "ahrefsbot",
    "mj12bot", "dotbot", "rogerbot", "screaming frog", "headlesschrome",
    "phantomjs", "selenium", "puppeteer", "playwright", "crawler", "spider",
    "bot/", "http-client", "python-requests", "curl/", "wget/",
  ];
  if (botPatterns.some((p) => ua.includes(p))) return true;
  // Sinais clássicos de automação
  const nav = navigator as Navigator & { webdriver?: boolean };
  if (nav.webdriver) return true;
  if (!navigator.language) return true;
  return false;
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedFrom = (location.state as { from?: string } | null)?.from;
  const from = requestedFrom?.startsWith(ADMIN_BASE) ? requestedFrom : ADMIN_BASE;

  // Bloqueio anti-bot: redireciona pra home pública (anúncio) sem deixar
  // nada visível pra crawlers. Roda antes do render do form.
  useEffect(() => {
    if (looksLikeBot()) {
      window.location.replace("/");
    }
  }, []);

  // Marca a página como noindex/nofollow enquanto estiver montada.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow, noarchive, nosnippet";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  // Disfarce: troca favicon e título da aba pra OLX já no primeiro render (síncrono),
  // evitando o flash do título/favicon antigo.
  if (typeof document !== "undefined") {
    applyOlxDisguise();
  }
  useEffect(() => {
    return () => restoreOriginalTab();
  }, []);

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, navigate, from]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let email = identifier.trim();
    if (!email.includes("@")) {
      // Resolve username -> email interno via RPC pública
      const { data, error: rpcErr } = await supabase.rpc("email_for_username", {
        _username: email,
      });
      if (rpcErr || !data) {
        setSubmitting(false);
        return toast.error("Usuário ou senha inválidos");
      }
      email = data as string;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) return toast.error("Usuário ou senha inválidos");
    toast.success("Bem-vindo de volta!");
    navigate(from, { replace: true });
  };

  return (
    <div className="relative flex min-h-[100dvh] items-start justify-center overflow-hidden bg-black px-4 pt-12 pb-8 sm:pt-20">
      {/* Imagem de fundo responsiva: cobre a tela em qualquer proporção sem distorcer */}
      <img
        src={loginBg}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        // @ts-expect-error fetchpriority é HTML válido mas ainda não tipado no React
        fetchpriority="high"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center select-none"
      />
      {/* Overlay pra deixar o conteúdo legível */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/80" />
      <div className="absolute inset-0 bg-gradient-glow opacity-60" />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-4 text-center">
          <Link to={ADMIN_LOGIN_PATH} className="inline-block">
            <span className="text-gradient text-xl font-bold tracking-tight sm:text-2xl">Painel Valididy</span>
          </Link>
        </div>

        <div className="relative rounded-2xl border border-primary/25 bg-card/40 p-5 shadow-[0_20px_60px_-20px_hsl(356_95%_30%/0.55)] backdrop-blur-2xl sm:p-7">
          {/* Borda gradiente sutil em volta do card */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/20 via-transparent to-accent/15 opacity-60 [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] [mask-composite:exclude] p-px" />

          <form onSubmit={onLogin} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="identifier"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Usuário
              </Label>
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="seu usuário"
                className="h-12 rounded-xl border-primary/20 bg-background/50 px-4 text-base text-foreground placeholder:text-muted-foreground/60 transition-all focus-visible:border-primary/60 focus-visible:bg-background/70 focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15),0_0_24px_hsl(var(--primary)/0.25)] focus-visible:ring-0 sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-primary/20 bg-background/50 px-4 pr-12 text-base text-foreground placeholder:text-muted-foreground/60 transition-all focus-visible:border-primary/60 focus-visible:bg-background/70 focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15),0_0_24px_hsl(var(--primary)/0.25)] focus-visible:ring-0 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="group relative mt-2 h-12 w-full overflow-hidden rounded-xl bg-gradient-primary text-base font-semibold tracking-wide shadow-glow transition-all hover:shadow-[0_0_32px_hsl(var(--primary)/0.6)] hover:brightness-110 sm:text-sm"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao entrar você concorda com os termos de uso da plataforma.
        </p>
      </div>
    </div>
  );
}
