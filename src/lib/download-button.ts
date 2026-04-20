/**
 * Substitui o href de qualquer link/botão de download existente
 * no HTML clonado pela URL externa configurada pelo dono do anúncio.
 *
 * Heurística: procura links/botões cujo texto contenha "baixar",
 * "download", "instalar", "obter app" ou similar, e troca o href
 * (ou injeta script de click) pra apontar pra URL configurada.
 */
const DOWNLOAD_TEXT_REGEX =
  /\b(baixar|baixe|download|instalar|instale|obter|obtenha|jogar|get\s+app|get\s+the\s+app)\b/i;

export function applyDownloadUrl(html: string, downloadUrl: string | null | undefined): string {
  const url = (downloadUrl || "").trim();
  if (!url || !html) return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    let touched = 0;

    // 1) <a> com texto de download → reescreve href
    const anchors = Array.from(doc.querySelectorAll("a"));
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
        a.setAttribute("download", "");
        a.setAttribute("data-download-trigger", "1");
        touched++;
      }
    });

    // 2) Botões e outros clicáveis com texto de download → marca com data-attr
    const clickable = Array.from(
      doc.querySelectorAll(
        "button, [role='button'], .btn, .button, .download, .download-btn, .btn-download"
      )
    );
    clickable.forEach((el) => {
      const text = (el.textContent || "").trim();
      const aria = el.getAttribute("aria-label") || "";
      if (!DOWNLOAD_TEXT_REGEX.test(text) && !DOWNLOAD_TEXT_REGEX.test(aria)) return;
      el.setAttribute("data-download-trigger", "1");
      touched++;
    });

    // 3) Injeta script que intercepta o click em qualquer elemento marcado
    //    e força o download via <a download> programático.
    const script = doc.createElement("script");
    script.setAttribute("data-download-script", "1");
    script.textContent = `
(function(){
  var URL_ = ${JSON.stringify(url)};
  function trigger(e){
    if (e) { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); }
    var a = document.createElement('a');
    a.href = URL_;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('download', '');
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ a.remove(); }, 200);
  }
  document.addEventListener('click', function(e){
    var t = e.target;
    while (t && t !== document.body) {
      if (t.nodeType === 1 && t.getAttribute && t.getAttribute('data-download-trigger') === '1') {
        return trigger(e);
      }
      t = t.parentNode;
    }
  }, true);
})();
`;
    (doc.body || doc.documentElement).appendChild(script);

    if (touched === 0) {
      console.info("[download-button] nenhum botão de download encontrado no HTML");
    } else {
      console.info("[download-button] " + touched + " elemento(s) configurado(s) pra download");
    }
    return "<!DOCTYPE html>" + doc.documentElement.outerHTML;
  } catch (e) {
    console.warn("[download-button] falha ao aplicar URL:", e);
    return html;
  }
}
