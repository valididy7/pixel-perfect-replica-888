import { FormEvent, useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ADMIN_BASE } from "@/lib/admin-route";
import loginBg from "@/assets/login-bg.jpg";
import { LoginMascot } from "@/components/LoginMascot";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || ADMIN_BASE;

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, navigate, from]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<"identifier" | "password" | null>(null);

  const mascotMode: "idle" | "watching" | "hiding" =
    focusedField === "password" ? "hiding" : focusedField === "identifier" ? "watching" : "idle";

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
    <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-background px-4 pt-12 sm:pt-20">
      {/* Imagem de fundo responsiva: cobre a tela em qualquer proporção sem distorcer */}
      <img
        src={loginBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center select-none"
      />
      {/* Overlay pra deixar o conteúdo legível */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/80" />
      <div className="absolute inset-0 bg-gradient-glow opacity-60" />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-4 text-center">
          <Link to={ADMIN_BASE} className="inline-block">
            <span className="text-gradient text-xl font-bold tracking-tight sm:text-2xl">Painel Valididy</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-elegant backdrop-blur-xl sm:p-6">
          <LoginMascot mode={mascotMode} watchProgress={identifier.length} />
          <form onSubmit={onLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Usuário</Label>
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onFocus={() => setFocusedField("identifier")}
                onBlur={() => setFocusedField((f) => (f === "identifier" ? null : f))}
                placeholder="seu usuário"
                className="h-11 text-base sm:h-10 sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField((f) => (f === "password" ? null : f))}
                placeholder="••••••••"
                className="h-11 text-base sm:h-10 sm:text-sm"
              />
            </div>
            <Button type="submit" disabled={submitting} className="h-11 w-full bg-gradient-primary shadow-glow hover:opacity-90 sm:h-10">
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
