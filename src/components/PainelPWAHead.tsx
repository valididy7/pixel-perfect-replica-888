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
      if (previousThemeColor && previousThemeColorContent !== undefined) {
        previousThemeColor.content = previousThemeColorContent;
      }
    };
  }, [isPainelArea]);

  return null;
}