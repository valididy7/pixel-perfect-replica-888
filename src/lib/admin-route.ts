/**
 * Rotas internas em formato ofuscado (base64) pra não aparecerem
 * como texto puro em buscas no bundle.
 */
const _d = (s: string) => {
  if (typeof atob === "function") return atob(s);
  // fallback Node/SSR
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).Buffer?.from(s, "base64").toString("utf-8") ?? "";
};

export const ADMIN_BASE = _d("L2s3bTItenE5eC1yNG44");

export const adminPath = (sub: string = "") => {
  if (!sub) return ADMIN_BASE;
  return `${ADMIN_BASE}${sub.startsWith("/") ? sub : `/${sub}`}`;
};

export const ADMIN_GATE_KEY = "olx_admin_gate_token";

export const ADMIN_LOGIN_PATH = _d("L2EzdjgtcHcyay1sNnl0");