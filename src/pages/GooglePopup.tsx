import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

/**
 * Página leve aberta DENTRO de uma popup pelo PreviewFrame para fazer o
 * OAuth com o Google sem recarregar a página principal do anúncio.
 *
 * Fluxo:
 * 1) Popup abre nesta rota.
 * 2) Se ainda não tem ?code/#access_token, dispara signInWithOAuth
 *    (redireciona DENTRO da popup pro Google).
 * 3) Google redireciona de volta pra cá; capturamos a sessão, lemos
 *    o e-mail, fazemos signOut, postamos pro window.opener e fechamos.
 */
export default function GooglePopup() {
  useEffect(() => {
    let cancelled = false;

    const post = (msg: Record<string, unknown>) => {
      try {
        window.opener?.postMessage({ source: "olx-google-popup", ...msg }, "*");
      } catch {
        /* ignore */
      }
    };

    (async () => {
      // 1) Já voltamos do Google? Tenta pegar a sessão.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const email = data?.session?.user?.email?.trim();
      if (email) {
        // Não queremos que a pessoa fique logada — desloga e devolve só o e-mail.
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        post({ ok: true, email });
        setTimeout(() => window.close(), 50);
        return;
      }

      // 2) Ainda não temos sessão — dispara o OAuth dentro da popup.
      try {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.href,
          extraParams: { prompt: "select_account" },
        });
        if (result.error) {
          post({ ok: false, error: String(result.error) });
          setTimeout(() => window.close(), 50);
          return;
        }
        // Se setSession funcionou aqui mesmo (sem redirect), pega email.
        if (!result.redirected) {
          const after = await supabase.auth.getSession();
          const e2 = after.data?.session?.user?.email?.trim();
          if (e2) {
            try { await supabase.auth.signOut(); } catch { /* ignore */ }
            post({ ok: true, email: e2 });
            setTimeout(() => window.close(), 50);
          }
        }
      } catch (err) {
        post({ ok: false, error: err instanceof Error ? err.message : String(err) });
        setTimeout(() => window.close(), 50);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
      }}
      aria-hidden
    />
  );
}