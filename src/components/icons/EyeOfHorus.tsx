import { SVGProps } from "react";

/**
 * Ícone Olho de Hórus (Wedjat) — geometria minimalista pro tema egípcio.
 * Usa currentColor pra herdar a cor do contexto (dourado, etc).
 */
export const EyeOfHorus = ({
  className,
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Sobrancelha */}
    <path d="M8 22 C 20 14, 40 14, 56 20" />
    {/* Contorno superior do olho */}
    <path d="M10 30 C 22 22, 42 22, 56 28" />
    {/* Contorno inferior do olho */}
    <path d="M10 30 C 20 38, 42 38, 56 28" />
    {/* Íris */}
    <circle cx="32" cy="30" r="4.2" fill="currentColor" stroke="none" />
    {/* Lágrima reta (descida) */}
    <path d="M30 38 L 28 50" />
    {/* Espiral característica do Wedjat */}
    <path d="M36 38 C 42 40, 46 44, 44 50 C 43 53, 40 53, 39 50 C 38.4 48, 40 47, 41 48" />
  </svg>
);

export default EyeOfHorus;