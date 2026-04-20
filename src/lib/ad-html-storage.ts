import LZString from "lz-string";

/**
 * Comprime HTML antes de gravar no banco (reduz 80-90% o tamanho).
 * Prefixa com "lz:" pra reconhecer formato.
 */
export function compressStoredHtml(html: string): string {
  if (!html) return "";
  return "lz:" + LZString.compressToBase64(html);
}

export function decompressStoredHtml(stored: string | null | undefined): string {
  if (!stored) return "";
  if (stored.startsWith("lz:")) {
    return LZString.decompressFromBase64(stored.slice(3)) || "";
  }
  return stored; // legado não comprimido
}
