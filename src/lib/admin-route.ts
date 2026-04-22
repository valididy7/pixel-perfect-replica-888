/**
 * Prefixo da rota secreta do painel admin.
 * Centralizado pra ser fácil trocar caso necessário.
 */
export const ADMIN_BASE = "/painel-valedidy";

export const adminPath = (sub: string = "") => {
  if (!sub) return ADMIN_BASE;
  return `${ADMIN_BASE}${sub.startsWith("/") ? sub : `/${sub}`}`;
};

export const ADMIN_GATE_KEY = "olx_admin_gate_token";

/** Rota de login escondida — não usar `/login` puro. */
export const ADMIN_LOGIN_PATH = "/login-x9k2m-acesso";