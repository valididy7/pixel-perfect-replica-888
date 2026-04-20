/**
 * Anexa interações ao iframe carregado:
 * - Bloqueia clicks em links externos (postMessage pro parent)
 * - Intercepta botões "comprar" residuais
 * - Esconde elementos nativos indesejados
 */
export function attachIframeInteractions(doc: Document): () => void {
  const onClick = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const a = target.closest("a") as HTMLAnchorElement | null;
    if (a?.href) {
      e.preventDefault();
      window.parent.postMessage({ type: "iframe-link-click", url: a.href }, "*");
    }
    const buyBtn = target.closest('[data-action="buy"], [data-testid*="buy" i], [data-testid*="chat" i]');
    if (buyBtn) {
      e.preventDefault();
      window.parent.postMessage({ type: "iframe-buy-click" }, "*");
    }
  };

  doc.addEventListener("click", onClick, true);

  // Esconde elementos nativos residuais
  doc.querySelectorAll('[data-testid="chat-button"], [data-testid="report-ad"]').forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });

  return () => {
    doc.removeEventListener("click", onClick, true);
  };
}
