import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ShieldCheck, User as UserIcon, ArrowLeft, KeyRound, Circle } from "lucide-react";
import { ADMIN_BASE } from "@/lib/admin-route";
import { useAuth } from "@/contexts/AuthContext";

type Row = {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  roles: string[];
  last_seen_at: string | null;
};

export default function UsersAdmin() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [, setTick] = useState(0);

  // Tick a cada 30s pra recalcular "online" sem refetch
  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "list" },
    });
    setLoading(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Erro ao listar");
      return;
    }
    setRows(data.users || []);
  };

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "create", username, password },
    });
    setCreating(false);
    if (error || data?.error) return toast.error(data?.error || error?.message || "Erro");
    toast.success("Usuário criado");
    setUsername(""); setPassword("");
    void load();
  };

  const remove = async (id: string, label: string) => {
    if (!confirm(`Apagar ${label}?`)) return;
    setRows((p) => p.filter((r) => r.id !== id));
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "delete", id },
    });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Erro");
      void load();
      return;
    }
    toast.success("Removido");
  };

  const resetPw = async (id: string) => {
    const pw = prompt("Nova senha (mínimo 6 caracteres):") || "";
    if (pw.length < 6) return;
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "reset_password", id, password: pw },
    });
    if (error || data?.error) return toast.error(data?.error || error?.message || "Erro");
    toast.success("Senha atualizada");
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-3">
          <Link to={ADMIN_BASE} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao painel
          </Link>
          <h1 className="text-lg font-semibold">Usuários</h1>
        </header>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Criar usuário
          </h2>
          <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="u">Usuário</Label>
              <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p">Senha</Label>
              <Input id="p" type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={creating} className="w-full">
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Todos os usuários</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const isAdmin = r.roles.includes("admin");
                const self = r.id === user?.id;
                const lastSeenMs = r.last_seen_at ? Date.now() - new Date(r.last_seen_at).getTime() : null;
                const online = lastSeenMs !== null && lastSeenMs < 90_000; // 1m30 de tolerância
                const lastSeenLabel = !r.last_seen_at
                  ? "nunca conectou"
                  : online
                    ? "online agora"
                    : formatLastSeen(lastSeenMs!);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {isAdmin ? <ShieldCheck className="h-4 w-4 text-primary" /> : <UserIcon className="h-4 w-4 text-muted-foreground" />}
                        {r.username || r.email}
                        {self && <span className="text-xs text-muted-foreground">(você)</span>}
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <Circle className={`h-2 w-2 ${online ? "fill-green-500 text-green-500" : "fill-muted-foreground/40 text-muted-foreground/40"}`} />
                        <span className={online ? "text-green-600 font-medium" : ""}>{lastSeenLabel}</span>
                        <span>· {isAdmin ? "admin" : "usuário"}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {self && (
                        <Button size="sm" variant="ghost" onClick={() => resetPw(r.id)} title="Trocar minha senha">
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      )}
                      {!self && !isAdmin && (
                        <Button size="sm" variant="ghost" onClick={() => remove(r.id, r.username || r.email)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      {!self && isAdmin && (
                        <span className="text-xs text-muted-foreground italic">protegido</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function formatLastSeen(ms: number): string {
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "há menos de 1 min";
  if (min < 60) return `visto há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `visto há ${h} h`;
  const d = Math.floor(h / 24);
  return `visto há ${d} d`;
}