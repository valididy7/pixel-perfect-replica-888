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

    // Intercepta o bloco "Preciso/Precisa de ajuda" e abre o modal customizado.
    // Procura o ancestral mais próximo cujo texto seja CURTO e bata no padrão
    // (evita pegar o card inteiro do login).
    let node: HTMLElement | null = target;
    let helpHit = false;
    for (let i = 0; i < 6 && node; i++) {
      const t = (node.textContent || "").trim().toLowerCase();
      if (t.length <= 40 && /precis[oa]\s+de\s+ajuda/.test(t)) {
        helpHit = true;
        break;
      }
      node = node.parentElement;
    }
    if (helpHit) {
      e.preventDefault();
      e.stopPropagation();
      openHelpModal(doc);
      return;
    }

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

/**
 * Modal "Como podemos ajudar?" recriado e injetado dentro do iframe.
 */
function openHelpModal(doc: Document): void {
  if (doc.getElementById("__olx_help_modal__")) return;

  const overlay = doc.createElement("div");
  overlay.id = "__olx_help_modal__";
  overlay.setAttribute(
    "style",
    [
      "position:fixed",
      "inset:0",
      "background:rgba(0,0,0,.5)",
      "z-index:2147483647",
      "display:flex",
      "align-items:flex-end",
      "justify-content:center",
      "font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    ].join(";"),
  );

  const sheet = doc.createElement("div");
  sheet.setAttribute(
    "style",
    [
      "background:#fff",
      "width:100%",
      "max-width:480px",
      "border-radius:16px 16px 0 0",
      "padding:24px 20px 32px",
      "box-shadow:0 -4px 24px rgba(0,0,0,.15)",
      "animation:olxSlideUp .25s ease-out",
    ].join(";"),
  );

  const style = doc.createElement("style");
  style.textContent = `
    @keyframes olxSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .__olx_btn { display:flex; align-items:center; gap:12px; width:100%; padding:14px 16px; background:#fff; border:1px solid #e0e0e0; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600; color:#1a1a1a; text-align:left; transition:background .15s; font-family:inherit; }
    .__olx_btn:hover { background:#f5f5f5; }
    .__olx_btn svg { flex-shrink:0; }
    .__olx_close { background:transparent; border:0; cursor:pointer; padding:4px; display:flex; }
  `;
  doc.head.appendChild(style);

  sheet.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
      <button class="__olx_close" aria-label="Fechar">
        <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4A4A4A" d="M13.06 12l5.47 5.47a.75.75 0 0 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 1.06-1.06L12 10.94l5.47-5.47a.75.75 0 0 1 1.06 1.06L13.06 12z"/></svg>
      </button>
    </div>
    <div style="margin-bottom:20px;">
      <div style="font-size:18px;font-weight:600;color:#1a1a1a;margin-bottom:6px;">Como podemos ajudar?</div>
      <div style="font-size:14px;font-weight:400;color:#666;">Enviaremos um e-mail para ajudar você a acessar sua conta!</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <button class="__olx_btn">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#6E0AD6" d="M20.75 21v-2A4.75 4.75 0 0 0 16 14.25H8A4.75 4.75 0 0 0 3.25 19v2a.75.75 0 1 0 1.5 0v-2A3.25 3.25 0 0 1 8 15.75h8A3.25 3.25 0 0 1 19.25 19v2a.75.75 0 1 0 1.5 0zM12 11.75a4.75 4.75 0 1 1 0-9.5 4.75 4.75 0 0 1 0 9.5zm0-1.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5z"/></svg>
        <span>Quero reativar minha conta</span>
      </button>
      <button class="__olx_btn">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#6E0AD6" d="M6.25 10.25V7a5.75 5.75 0 0 1 11.5 0v3.25H19A2.75 2.75 0 0 1 21.75 13v7A2.75 2.75 0 0 1 19 22.75H5A2.75 2.75 0 0 1 2.25 20v-7A2.75 2.75 0 0 1 5 10.25h1.25zm1.5 0h8.5V7a4.25 4.25 0 1 0-8.5 0v3.25zM5 11.75c-.69 0-1.25.56-1.25 1.25v7c0 .69.56 1.25 1.25 1.25h14c.69 0 1.25-.56 1.25-1.25v-7c0-.69-.56-1.25-1.25-1.25H5z"/></svg>
        <span>Esqueci a minha senha</span>
      </button>
      <button class="__olx_btn">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#6E0AD6" d="M19.1893 13.0551H9C8.58579 13.0551 8.25 12.7193 8.25 12.3051C8.25 11.8908 8.58579 11.5551 9 11.5551H19.1893L16.4697 8.83538C16.1768 8.54249 16.1768 8.06762 16.4697 7.77472C16.7626 7.48183 17.2374 7.48183 17.5303 7.77472L21.5303 11.7747C21.8232 12.0676 21.8232 12.5425 21.5303 12.8354L17.5303 16.8354C17.2374 17.1283 16.7626 17.1283 16.4697 16.8354C16.1768 16.5425 16.1768 16.0676 16.4697 15.7747L19.1893 13.0551ZM10 21.5551C10.4142 21.5551 10.75 21.8908 10.75 22.3051C10.75 22.7193 10.4142 23.0551 10 23.0551H5C3.48122 23.0551 2.25 21.8238 2.25 20.3051V4.30505C2.25 2.78627 3.48122 1.55505 5 1.55505H10C10.4142 1.55505 10.75 1.89084 10.75 2.30505C10.75 2.71927 10.4142 3.05505 10 3.05505H5C4.30964 3.05505 3.75 3.6147 3.75 4.30505V20.3051C3.75 20.9954 4.30964 21.5551 5 21.5551H10Z"/></svg>
        <span>Entrar sem senha</span>
      </button>
    </div>
  `;

  overlay.appendChild(sheet);
  doc.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) close();
  });
  sheet.querySelector(".__olx_close")?.addEventListener("click", close);
}
