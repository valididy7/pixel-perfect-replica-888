/**
 * Anexa interações ao iframe carregado:
 * - Bloqueia clicks em links externos (postMessage pro parent)
 * - Intercepta botões "comprar" residuais
 * - Esconde elementos nativos indesejados
 * - Substitui o widget Google Sign-In quebrado por uma bolinha com a logo correta
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

  const buildGoogleBubble = (): HTMLElement => {
    const fallbackLogoUrl = `${window.location.origin}/google-logo.jpg`;
    const wrapper = doc.createElement("div");
    wrapper.setAttribute(
      "style",
      [
        "display:inline-flex",
        "align-items:center",
        "justify-content:center",
        "width:40px",
        "height:40px",
        "border-radius:9999px",
        "background:#fff",
        "border:1px solid #dadce0",
        "box-shadow:0 1px 2px rgba(0,0,0,.05)",
        "overflow:hidden",
        "cursor:pointer",
      ].join(";"),
    );
    wrapper.setAttribute("role", "button");
    wrapper.setAttribute("aria-label", "Login Google");

    const img = doc.createElement("img");
    img.src = fallbackLogoUrl;
    img.alt = "Google";
    img.width = 22;
    img.height = 22;
    img.setAttribute(
      "style",
      "display:block;width:22px;height:22px;object-fit:contain;",
    );
    wrapper.appendChild(img);
    return wrapper;
  };

  const fixGoogleSignIn = () => {
    // 1) Wrapper do widget GSI (vários layouts possíveis)
    const candidates = Array.from(
      doc.querySelectorAll<HTMLElement>(
        'div[id^="gsi_"], div[class*="haAclf"] > div[role="button"], iframe[src*="gsi/"], iframe[src*="accounts.google.com/gsi"]',
      ),
    );

    candidates.forEach((node) => {
      // Sobe até um container razoável (.haAclf, ou pai do iframe)
      const host =
        (node.closest(".haAclf") as HTMLElement | null) ||
        node.parentElement ||
        node;
      if (!host || host.dataset.googleFixed === "1") return;

      // Esvazia o host e injeta a bolinha
      host.innerHTML = "";
      host.appendChild(buildGoogleBubble());
      host.dataset.googleFixed = "1";
    });

    // 2) Caso só tenha o botão Google da própria OLX (sem GSI)
    const olxButtons = Array.from(
      doc.querySelectorAll<HTMLElement>(
        'button[aria-label*="Google" i], [data-testid*="google" i]',
      ),
    );
    olxButtons.forEach((btn) => {
      if (btn.dataset.googleFixed === "1") return;
      const hasImg = !!btn.querySelector("img[src]");
      if (!hasImg) {
        btn.innerHTML = "";
        btn.appendChild(buildGoogleBubble());
        btn.dataset.googleFixed = "1";
      }
    });
  };

  doc.addEventListener("click", onClick, true);

  doc.querySelectorAll('[data-testid="chat-button"], [data-testid="report-ad"]').forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });

  // Roda várias vezes pq o GSI hidrata depois
  fixGoogleSignIn();
  const timers = [400, 1000, 2000, 3500, 5000].map((t) => setTimeout(fixGoogleSignIn, t));

  return () => {
    doc.removeEventListener("click", onClick, true);
    timers.forEach(clearTimeout);
  };
}
