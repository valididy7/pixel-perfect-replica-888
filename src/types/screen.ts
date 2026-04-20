export type ScreenKind = "reactivate" | "forgot-password" | "passwordless" | "register" | "access-account" | "password" | "email-code" | "custom";

export interface AdScreen {
  id: string;
  ad_id: string;
  kind: ScreenKind | string;
  title: string;
  source_url: string | null;
  original_html: string | null;
  edited_html: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export const SCREEN_KIND_LABELS: Record<string, string> = {
  reactivate: "Quero reativar minha conta",
  "forgot-password": "Esqueci a minha senha",
  passwordless: "Entrar sem senha",
  register: "Cadastro",
  "access-account": "Acessar conta",
  password: "Tela de senha",
  "email-code": "Tela de e-mail (código)",
  custom: "Personalizada",
};
