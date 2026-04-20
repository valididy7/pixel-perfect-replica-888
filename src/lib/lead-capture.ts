import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "olx_lead_session_id";

export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export interface LeadValue {
  field_name: string;
  value: string;
}

/** Substitui placeholders {{lead.<campo>}} no HTML pelos valores capturados. */
export function applyLeadPlaceholders(html: string, leads: LeadValue[]): string {
  if (!html) return html;
  // Mapa: último valor por campo
  const map = new Map<string, string>();
  for (const l of leads) {
    if (l.value !== "") map.set(l.field_name.toLowerCase(), l.value);
  }
  return html.replace(/\{\{\s*lead\.([\w-]+)\s*\}\}/gi, (_m, key: string) => {
    const v = map.get(key.toLowerCase());
    return v != null ? escapeHtml(v) : "";
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inferFieldName(input: HTMLInputElement | HTMLTextAreaElement): string {
  const explicit =
    input.getAttribute("data-lead-field") ||
    input.getAttribute("name") ||
    input.id ||
    input.getAttribute("aria-label") ||
    input.getAttribute("placeholder") ||
    "";
  const t = (input as HTMLInputElement).type?.toLowerCase() || "text";
  const hay = `${explicit} ${t}`.toLowerCase();
  if (/e-?mail/.test(hay) || t === "email") return "email";
  if (/senha|password/.test(hay) || t === "password") return "password";
  if (/cpf/.test(hay)) return "cpf";
  if (/cnpj/.test(hay)) return "cnpj";
  if (/(telefone|phone|celular|tel\b)/.test(hay) || t === "tel") return "phone";
  if (/(nome|name)/.test(hay)) return "name";
  if (explicit) return explicit.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 40) || "field";
  return `field_${t}`;
}

interface CaptureCtx {
  adId: string;
  screenId?: string | null;
}

/** Liga a captura: escuta input em todos os inputs/textareas do doc, debounce 400ms, manda ao Supabase. */
export function attachLeadCapture(doc: Document, ctx: CaptureCtx): () => void {
  const sessionId = getSessionId();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null;
  const timers = new Map<HTMLElement, number>();
  const lastValues = new Map<HTMLElement, string>();

  const send = async (el: HTMLInputElement | HTMLTextAreaElement) => {
    const value = el.value ?? "";
    if (lastValues.get(el) === value) return;
    lastValues.set(el, value);
    const field_name = inferFieldName(el);
    try {
      await supabase.from("ad_leads").insert({
        ad_id: ctx.adId,
        screen_id: ctx.screenId ?? null,
        session_id: sessionId,
        field_name,
        value,
        user_agent: ua,
      });
    } catch (err) {
      // silencioso pra não quebrar o iframe
      console.warn("[lead-capture] falhou:", err);
    }
  };

  const onInput = (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    if (!(t instanceof HTMLInputElement) && !(t instanceof HTMLTextAreaElement)) return;
    const type = (t as HTMLInputElement).type?.toLowerCase();
    if (type === "hidden" || type === "submit" || type === "button" || type === "checkbox" || type === "radio") return;
    const prev = timers.get(t);
    if (prev) window.clearTimeout(prev);
    const id = window.setTimeout(() => send(t), 400);
    timers.set(t, id);
  };

  doc.addEventListener("input", onInput, true);

  return () => {
    doc.removeEventListener("input", onInput, true);
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
  };
}

/** Busca leads de UMA sessão (a sessão atual do visitante) pra hidratar placeholders. */
export async function fetchSessionLeads(adId: string, sessionId: string): Promise<LeadValue[]> {
  const { data, error } = await supabase
    .from("ad_leads")
    .select("field_name, value, created_at")
    .eq("ad_id", adId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("[lead-capture] fetchSessionLeads:", error);
    return [];
  }
  return (data ?? []) as LeadValue[];
}
