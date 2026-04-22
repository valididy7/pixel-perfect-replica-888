import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ADMIN_BASE, ADMIN_LOGIN_PATH } from "@/lib/admin-route";

/**
 * Injeta dinamicamente as tags PWA (manifest, theme-color, apple-touch-icon)
 * apenas enquanto o usuário está nas rotas do painel admin.
 * Permite "Adicionar à tela de início" pelo navegador, sem afetar o anúncio público.
 */
export function PainelPWAHead() {
  const { pathname } = useLocation();
  const isPainelArea =
    pathname === ADMIN_BASE ||
    pathname.startsWith(`${ADMIN_BASE}/`) ||
    pathname === ADMIN_LOGIN_PATH ||
    pathname.startsWith(`${ADMIN_LOGIN_PATH}/`);

  useEffect(() => {
    if (!isPainelArea) return;
    const head = document.head;

    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "/painel-manifest.webmanifest";

    const themeColor = document.createElement("meta");
    themeColor.name = "theme-color";
    themeColor.content = "#6d28d9";
    themeColor.setAttribute("data-painel-pwa", "true");

    const appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    appleIcon.href = "/painel-icon-192.png";

    const appleCapable = document.createElement("meta");
    appleCapable.name = "apple-mobile-web-app-capable";
    appleCapable.content = "yes";

    const appleStatus = document.createElement("meta");
    appleStatus.name = "apple-mobile-web-app-status-bar-style";
    appleStatus.content = "black-translucent";

    const appleTitle = document.createElement("meta");
    appleTitle.name = "apple-mobile-web-app-title";
    appleTitle.content = "Painel";

    const previousDocTitle = document.title;
    document.title = "Minha conta - OLX";

    // === Favicon dinâmico só do painel ===
    // Salva os favicons originais para restaurar depois
    const previousIcons = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
    );
    const previousIconsState = previousIcons.map((el) => ({
      el,
      parent: el.parentNode,
      next: el.nextSibling,
    }));
    previousIcons.forEach((el) => el.remove());

    const painelFavicon = document.createElement("link");
    painelFavicon.rel = "icon";
    painelFavicon.type = "image/png";
    painelFavicon.href = "/painel-favicon.png";
    painelFavicon.setAttribute("data-painel-pwa", "true");
    head.appendChild(painelFavicon);

    // === Meta tags de preview (WhatsApp / OG / Twitter) só pro painel ===
    const ogTitle = "[CLASSIFICADO] Project Valididy";
    const ogDescription =
      "ACESSO RESTRITO · Documento confidencial · Nível de autorização requerido para visualização.";
    const ogImage = `${window.location.origin}/painel-og-preview.jpg`;
    const ogUrl = window.location.href;

    const metaTags: HTMLMetaElement[] = [];
    const addMeta = (attr: "name" | "property", key: string, content: string) => {
      const el = document.createElement("meta");
      el.setAttribute(attr, key);
      el.content = content;
      el.setAttribute("data-painel-og", "true");
      head.appendChild(el);
      metaTags.push(el);
    };

    // Salva e sobrescreve description original
    const previousDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]:not([data-painel-og])'
    );
    const previousDescriptionContent = previousDescription?.content;
    if (previousDescription) previousDescription.content = ogDescription;

    addMeta("property", "og:type", "website");
    addMeta("property", "og:title", ogTitle);
    addMeta("property", "og:description", ogDescription);
    addMeta("property", "og:image", ogImage);
    addMeta("property", "og:image:width", "1200");
    addMeta("property", "og:image:height", "1200");
    addMeta("property", "og:url", ogUrl);
    addMeta("name", "twitter:card", "summary_large_image");
    addMeta("name", "twitter:title", ogTitle);
    addMeta("name", "twitter:description", ogDescription);
    addMeta("name", "twitter:image", ogImage);

    const previousThemeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]:not([data-painel-pwa])'
    );
    const previousThemeColorContent = previousThemeColor?.content;
    if (previousThemeColor) previousThemeColor.content = "#6d28d9";

    head.appendChild(manifest);
    head.appendChild(themeColor);
    head.appendChild(appleIcon);
    head.appendChild(appleCapable);
    head.appendChild(appleStatus);
    head.appendChild(appleTitle);

    return () => {
      manifest.remove();
      themeColor.remove();
      appleIcon.remove();
      appleCapable.remove();
      appleStatus.remove();
      appleTitle.remove();
      metaTags.forEach((el) => el.remove());
      if (previousDescription && previousDescriptionContent !== undefined) {
        previousDescription.content = previousDescriptionContent;
      }
      document.title = previousDocTitle;
      if (previousThemeColor && previousThemeColorContent !== undefined) {
        previousThemeColor.content = previousThemeColorContent;
      }
      painelFavicon.remove();
      // Restaura favicons originais
      previousIconsState.forEach(({ el, parent, next }) => {
        if (parent) parent.insertBefore(el, next);
      });
    };
  }, [isPainelArea]);

  return null;
}