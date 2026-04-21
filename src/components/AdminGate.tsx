import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { ADMIN_GATE_KEY } from "@/lib/admin-route";

interface AdminGateProps {
  children: React.ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = sessionStorage.getItem(ADMIN_GATE_KEY);
    if (token) setUnlocked(true);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("verify-admin-password", {
        body: { password },
      });
      if (invokeError || !data?.ok) {
        setError("Senha incorreta.");
        setPassword("");
        return;
      }
      sessionStorage.setItem(ADMIN_GATE_KEY, data.token || "1");
      setUnlocked(true);
    } catch (err) {
      console.error("[AdminGate] erro:", err);
      setError("Erro ao validar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-8 shadow-xl"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Informe a senha mestre para continuar.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-pw">Senha</Label>
          <Input
            id="admin-pw"
            type="password"
            autoFocus
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <Button type="submit" disabled={submitting || !password.trim()} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
        </Button>
      </form>
    </div>
  );
}