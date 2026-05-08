import { useMemo } from "react";

type Mode = "idle" | "watching" | "hiding";

interface Props {
  mode: Mode;
  /** Quantos caracteres já foram digitados no campo de usuário (move os olhos) */
  watchProgress?: number;
}

/**
 * Mascote estilo "macaquinho" que olha o que você digita
 * e tapa os olhos quando você está digitando a senha.
 */
export function LoginMascot({ mode, watchProgress = 0 }: Props) {
  // Olhos seguem o "cursor" — varia entre -3 e +3 px no eixo X
  const pupilX = useMemo(() => {
    if (mode !== "watching") return 0;
    const phase = (watchProgress % 8) / 8; // 0..1
    return Math.round((phase * 2 - 1) * 3); // -3..+3
  }, [mode, watchProgress]);

  const hiding = mode === "hiding";

  return (
    <div className="pointer-events-none flex justify-center">
      <svg
        viewBox="0 0 120 110"
        className="h-24 w-24 sm:h-28 sm:w-28"
        aria-hidden="true"
      >
        {/* Orelhas */}
        <circle cx="22" cy="55" r="14" fill="hsl(25 35% 25%)" />
        <circle cx="22" cy="55" r="7" fill="hsl(25 45% 40%)" />
        <circle cx="98" cy="55" r="14" fill="hsl(25 35% 25%)" />
        <circle cx="98" cy="55" r="7" fill="hsl(25 45% 40%)" />

        {/* Cabeça */}
        <ellipse cx="60" cy="58" rx="40" ry="38" fill="hsl(25 40% 28%)" />

        {/* Rosto claro */}
        <ellipse cx="60" cy="68" rx="28" ry="26" fill="hsl(30 55% 70%)" />

        {/* Olhos (brancos) */}
        <g>
          <ellipse cx="48" cy="58" rx="8" ry="9" fill="white" />
          <ellipse cx="72" cy="58" rx="8" ry="9" fill="white" />
          {/* Pupilas */}
          <circle
            cx={48 + pupilX}
            cy="60"
            r="3.5"
            fill="hsl(354 30% 8%)"
            style={{ transition: "cx 200ms ease-out" }}
          />
          <circle
            cx={72 + pupilX}
            cy="60"
            r="3.5"
            fill="hsl(354 30% 8%)"
            style={{ transition: "cx 200ms ease-out" }}
          />
        </g>

        {/* Boca / sorriso muda conforme o modo */}
        {hiding ? (
          <path
            d="M50 80 Q60 75 70 80"
            stroke="hsl(354 30% 8%)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M50 78 Q60 88 70 78"
            stroke="hsl(354 30% 8%)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Mãozinhas que sobem pra tapar os olhos quando hiding */}
        <g
          style={{
            transform: hiding ? "translateY(0)" : "translateY(40px)",
            transition: "transform 280ms cubic-bezier(.5,1.6,.5,1)",
            transformOrigin: "center",
          }}
        >
          <ellipse cx="48" cy="58" rx="11" ry="10" fill="hsl(25 40% 28%)" />
          <ellipse cx="48" cy="58" rx="8" ry="7" fill="hsl(30 55% 70%)" />
          <ellipse cx="72" cy="58" rx="11" ry="10" fill="hsl(25 40% 28%)" />
          <ellipse cx="72" cy="58" rx="8" ry="7" fill="hsl(30 55% 70%)" />
        </g>
      </svg>
    </div>
  );
}