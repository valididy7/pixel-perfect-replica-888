import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle2, AlertCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    document.title = "Descadastrar — OLX";
    if (!token) {
      setState("invalid");
      return;
    }
    let alive = true;
    fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!alive) return;
        if (r.ok && data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => {
        if (alive) setState("invalid");
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setState("submitting");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ token }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.success) setState("success");
      else if (data.reason === "already_unsubscribed") setState("already");
      else {
        setErrorMsg(data.error || "Erro ao processar.");
        setState("error");
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erro de rede");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-card text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          {state === "success" || state === "already" ? (
            <CheckCircle2 className="h-6 w-6 text-success" />
          ) : state === "invalid" || state === "error" ? (
            <AlertCircle className="h-6 w-6 text-destructive" />
          ) : (
            <MailX className="h-6 w-6 text-primary" />
          )}
        </div>

        {state === "loading" && (
          <>
            <h1 className="text-lg font-semibold">Validando…</h1>
            <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-muted-foreground" />
          </>
        )}

        {state === "valid" && (
          <>
            <h1 className="text-lg font-semibold">Confirmar descadastro?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Você não receberá mais e-mails enviados deste remetente.
            </p>
            <Button onClick={handleConfirm} className="mt-6 w-full">
              Confirmar descadastro
            </Button>
          </>
        )}

        {state === "submitting" && (
          <>
            <h1 className="text-lg font-semibold">Processando…</h1>
            <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-muted-foreground" />
          </>
        )}

        {state === "success" && (
          <>
            <h1 className="text-lg font-semibold">Descadastrado com sucesso</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Você não receberá mais e-mails deste remetente.
            </p>
          </>
        )}

        {state === "already" && (
          <>
            <h1 className="text-lg font-semibold">Já descadastrado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Este e-mail já foi removido da nossa lista.
            </p>
          </>
        )}

        {state === "invalid" && (
          <>
            <h1 className="text-lg font-semibold">Link inválido ou expirado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Não foi possível validar este link de descadastro.
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <h1 className="text-lg font-semibold">Erro</h1>
            <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
            <Button onClick={handleConfirm} variant="outline" className="mt-4 w-full">
              Tentar novamente
            </Button>
          </>
        )}
      </div>
    </div>
  );
}