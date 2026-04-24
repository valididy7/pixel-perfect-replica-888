/**
 * Estilos semânticos por "tela atual" do visitante.
 * Usa tokens do design system (primary/success/warning/destructive)
 * pra manter coerência com o tema do painel.
 */

export interface ScreenStyle {
  /** Classes Tailwind aplicadas no badge (bg + texto + opcional anel/animação). */
  className: string;
  /** Rótulo amigável da tela. */
  label: string;
}

const STYLES: Record<string, ScreenStyle> = {
  main: {
    className: "bg-muted text-muted-foreground",
    label: "Tela home",
  },
  "access-account": {
    className: "bg-primary/15 text-primary",
    label: "Tela acessar",
  },
  password: {
    className: "bg-warning/20 text-warning",
    label: "Digitando senha",
  },
  "email-code": {
    className: "bg-success/20 text-success ring-1 ring-success/40 animate-pulse",
    label: "Aguardando código",
  },
  "forgot-password": {
    className: "bg-destructive/15 text-destructive",
    label: "Esqueci a senha",
  },
  passwordless: {
    className: "bg-destructive/15 text-destructive",
    label: "Entrar sem senha",
  },
  reactivate: {
    className: "bg-destructive/15 text-destructive",
    label: "Reativar conta",
  },
};

const FALLBACK: ScreenStyle = {
  className: "bg-muted text-muted-foreground",
  label: "—",
};

export function getScreenStyle(kind?: string | null): ScreenStyle {
  if (!kind) return FALLBACK;
  return STYLES[kind] ?? { className: "bg-muted text-muted-foreground", label: kind };
}