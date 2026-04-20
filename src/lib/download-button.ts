/**
 * Substitui o href de qualquer link/botão de download existente
 * no HTML clonado pela URL externa configurada pelo dono do anúncio.
 *
 * Heurística: procura links/botões cujo texto contenha "baixar",
 * "download", "instalar", "obter app" ou similar, e troca o href
 * (ou envolve o botão num <a>) pra apontar pra URL configurada.
 */
const DOWNLOAD_TEXT_REGEX =
  /\b(baixar|baixe|download|instalar|instale|obter|obtenha|get\s+app|get\s+the\s+app)\b/i;

export function applyDownloadUrl(html: string, downloadUrl: string | null | undefined): string {
  const url = (downloadUrl || "").trim();
  if (!url || !html) return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // 1) Reescreve <a> que pareçam ser de download
    const anchors = Array.from(doc.querySelectorAll("a"));
    let touched = 0;
    anchors.forEach((a) => {
      const text = (a.textContent || "").trim();
      const aria = a.getAttribute("aria-label") || "";
      const title = a.getAttribute("title") || "";
      if (
        DOWNLOAD_TEXT_REGEX.test(text) ||
        DOWNLOAD_TEXT_REGEX.test(aria) ||
        DOWNLOAD_TEXT_REGEX.test(title)
      ) {
        a.setAttribute("href", url);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
        a.setAttribute("data-download-link", "1");
        touched++;
      }
    });

    // 2) Botões com texto de download → envolve num <a>
    const buttons = Array.from(doc.querySelectorAll("button"));
    buttons.forEach((btn) => {
      const text = (btn.textContent || "").trim();
      if (!DOWNLOAD_TEXT_REGEX.test(text)) return;
      if (btn.closest("a[data-download-link='1']")) return;
      const wrapper = doc.createElement("a");
      wrapper.href = url;
      wrapper.target = "_blank";
      wrapper.rel = "noopener noreferrer";
      wrapper.setAttribute("data-download-link", "1");
      wrapper.style.cssText = "display:inline-block;text-decoration:none;color:inherit;";
      btn.parentNode?.insertBefore(wrapper, btn);
      wrapper.appendChild(btn);
      touched++;
    });

    if (touched === 0) {
      console.info("[download-button] nenhum botão de download encontrado no HTML");
    } else {
      console.info(`[download-button] ${touched} botão(ões) reescrito(s) com URL de download`);
    }
    return "<!DOCTYPE html>" + doc.documentElement.outerHTML;
  } catch (e) {
    console.warn("[download-button] falha ao aplicar URL:", e);
    return html;
  }
}
