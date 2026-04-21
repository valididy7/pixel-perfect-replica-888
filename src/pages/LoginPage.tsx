import { FormEvent, useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { ADMIN_BASE } from "@/lib/admin-route";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || ADMIN_BASE;

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, navigate, from]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    navigate(from, { replace: true });
  };

  const onSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Você já pode fazer login.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-gradient-glow" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(263_85%_65%/0.08),transparent_50%),radial-gradient(circle_at_80%_80%,hsl(190_95%_55%/0.06),transparent_50%)]" />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <Link to={ADMIN_BASE} className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">CloneAd</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Clone qualquer anúncio com um link.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-xl shadow-elegant">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary hover:opacity-90 shadow-glow">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={onSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-su">Email</Label>
                  <Input id="email-su" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-su">Senha</Label>
                  <Input id="password-su" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary hover:opacity-90 shadow-glow">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao entrar você concorda com os termos de uso da plataforma.
        </p>
      </div>
    </div>
  );
}
