import { AdField, ParseResult } from "@/types/ad";

const TITLE_SELECTORS = [
  'h1[data-testid="ad-title"]',
  'h1[itemprop="name"]',
  'h1.ad-title',
  'h1',
];

const PRICE_SELECTORS = [
  '[data-testid="ad-price"]',
  '[itemprop="price"]',
  '.price',
  '[class*="price" i]',
];

const DESC_SELECTORS = [
  '[data-testid="ad-description"]',
  '[itemprop="description"]',
  '.description',
  '[class*="description" i]',
];

function uniqueSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;
  // Caminho até o root usando :nth-of-type
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur.nodeType === 1 && cur.tagName.toLowerCase() !== "html") {
    const tag = cur.tagName.toLowerCase();
    const parent = cur.parentElement;
    if (!parent) {
      parts.unshift(tag);
      break;
    }
    const sameTag = Array.from(parent.children).filter((c) => c.tagName === cur!.tagName);
    if (sameTag.length === 1) {
      parts.unshift(tag);
    } else {
      const idx = sameTag.indexOf(cur) + 1;
      parts.unshift(`${tag}:nth-of-type(${idx})`);
    }
    cur = parent;
  }
  return parts.join(" > ");
}

function findFirst(doc: Document, selectors: string[]): Element | null {
  for (const sel of selectors) {
    try {
      const el = doc.querySelector(sel);
      if (el && el.textContent?.trim()) return el;
    } catch {
      // selector inválido, ignora
    }
  }
  return null;
}

export function parseAdHTML(rawHtml: string): ParseResult {
  const fields: AdField[] = [];
  const imageUrls: string[] = [];

  if (!rawHtml) return { fields, imageUrls };

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(rawHtml, "text/html");
  } catch {
    return { fields, imageUrls };
  }

  // Title
  const titleEl = findFirst(doc, TITLE_SELECTORS);
  if (titleEl) {
    fields.push({
      id: "title",
      label: "Título",
      value: titleEl.textContent?.trim() || "",
      selector: uniqueSelector(titleEl),
      category: "info",
    });
  }

  // Price
  const priceEl = findFirst(doc, PRICE_SELECTORS);
  if (priceEl) {
    fields.push({
      id: "price",
      label: "Preço",
      value: priceEl.textContent?.trim() || "",
      selector: uniqueSelector(priceEl),
      category: "info",
    });
  }

  // Description
  const descEl = findFirst(doc, DESC_SELECTORS);
  if (descEl) {
    fields.push({
      id: "description",
      label: "Descrição",
      value: descEl.textContent?.trim() || "",
      selector: uniqueSelector(descEl),
      category: "description",
      multiline: true,
    });
  }

  // Imagens grandes (>200px ou data-zoom-image)
  const imgs = Array.from(doc.querySelectorAll("img"));
  for (const img of imgs) {
    const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
    if (!src || src.startsWith("data:")) continue;
    if (!/\.(jpg|jpeg|png|webp)/i.test(src)) continue;
    if (imageUrls.includes(src)) continue;
    imageUrls.push(src);
    if (imageUrls.length >= 12) break;
  }

  return { fields, imageUrls };
}

export function rebuildHTMLWithEdits(
  originalHtml: string,
  fields: AdField[],
  imageUrls: string[],
): string {
  if (!originalHtml) return "";

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(originalHtml, "text/html");
  } catch {
    return originalHtml;
  }

  for (const field of fields) {
    if (!field.selector) continue;
    try {
      const el = doc.querySelector(field.selector);
      if (el) {
        // Limpa filhos e seta texto (mantém estrutura inline simples)
        el.textContent = field.value;
      }
    } catch {
      // selector inválido, ignora
    }
  }

  // Substituição de imagens (por ordem)
  if (imageUrls && imageUrls.length) {
    const imgs = Array.from(doc.querySelectorAll("img")).filter((img) => {
      const src = img.getAttribute("src") || "";
      return src && !src.startsWith("data:") && /\.(jpg|jpeg|png|webp)/i.test(src);
    });
    imgs.forEach((img, idx) => {
      if (imageUrls[idx]) {
        img.setAttribute("src", imageUrls[idx]);
        img.removeAttribute("srcset");
      }
    });
  }

  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}
