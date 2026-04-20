/**
 * Anexa interações ao iframe carregado:
 * - Bloqueia clicks em links externos (postMessage pro parent)
 * - Intercepta botões "comprar" residuais
 * - Esconde elementos nativos indesejados
 * - Aplica fallback visual para ícone quebrado do Google
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

  const applyGoogleLogoFallback = () => {
    const fallbackLogoUrl = `${window.location.origin}/google-logo.jpg`;
    const googleButtons = Array.from(doc.querySelectorAll<HTMLElement>(".nsm7Bb-HzV7m-LgbsSe"));

    googleButtons.forEach((button) => {
      const iconSlot = button.querySelector<HTMLElement>(".nsm7Bb-HzV7m-LgbsSe-Bz112c-haAclf") || button;
      const existingVisual = iconSlot.querySelector("img, svg, picture, canvas");
      const existingImg = iconSlot.querySelector<HTMLImageElement>("img");
      const imageBroken = !!existingImg && (!existingImg.getAttribute("src") || existingImg.naturalWidth === 0);

      if (!existingVisual || imageBroken) {
        iconSlot.querySelectorAll("img, svg, picture, canvas").forEach((el) => el.remove());

        const img = doc.createElement("img");
        img.src = fallbackLogoUrl;
        img.alt = "Google";
        img.width = 18;
        img.height = 18;
        img.setAttribute(
          "style",
          "display:block;width:18px;height:18px;object-fit:contain;border-radius:9999px;",
        );

        iconSlot.style.display = "flex";
        iconSlot.style.alignItems = "center";
        iconSlot.style.justifyContent = "center";
        iconSlot.style.overflow = "hidden";
        iconSlot.appendChild(img);
      }
    });
  };

  doc.addEventListener("click", onClick, true);

  doc.querySelectorAll('[data-testid="chat-button"], [data-testid="report-ad"]').forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });

  applyGoogleLogoFallback();
  setTimeout(applyGoogleLogoFallback, 600);
  setTimeout(applyGoogleLogoFallback, 1800);

  return () => {
    doc.removeEventListener("click", onClick, true);
  };
}
