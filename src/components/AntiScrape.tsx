import { useEffect } from "react";

/**
 * Casual anti-copy deterrents: disables right-click context menu, text
 * selection, copy, and image dragging across the public site.
 *
 * NOTE: This only stops casual copying — it cannot stop a determined
 * scraper. Form inputs/textareas and contenteditable areas stay usable,
 * and the whole layer is disabled on /admin so staff tooling still works.
 */
const AntiScrape = () => {
  useEffect(() => {
    const isAdmin = () => window.location.pathname.startsWith("/admin");

    const LEGAL_ROUTES = ["/privacy", "/terms", "/legal-notice", "/cookies", "/disclosure", "/sitemap"];
    const isLegalPage = () => LEGAL_ROUTES.some((r) => window.location.pathname.startsWith(r));

    const isEditable = (el: EventTarget | null) => {
      const node = el as HTMLElement | null;
      if (!node || !node.closest) return false;
      return !!node.closest(
        'input, textarea, select, [contenteditable=""], [contenteditable="true"]'
      );
    };

    const blockContextMenu = (e: MouseEvent) => {
      if (isAdmin() || isLegalPage() || isEditable(e.target)) return;
      e.preventDefault();
    };

    const blockCopy = (e: ClipboardEvent) => {
      if (isAdmin() || isLegalPage() || isEditable(e.target)) return;
      e.preventDefault();
    };

    const blockDragStart = (e: DragEvent) => {
      if (isAdmin()) return;
      const node = e.target as HTMLElement | null;
      if (node && node.tagName === "IMG") e.preventDefault();
    };

    // Disable text selection visually (skip admin + editable handled by CSS class).
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-anti-scrape", "");
    styleEl.textContent = `
      body:not(.admin-route):not(.legal-route) {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      body:not(.admin-route):not(.legal-route) input,
      body:not(.admin-route):not(.legal-route) textarea,
      body:not(.admin-route):not(.legal-route) select,
      body:not(.admin-route):not(.legal-route) [contenteditable] {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
      body:not(.admin-route) img {
        -webkit-user-drag: none;
        user-drag: none;
      }
    `;
    document.head.appendChild(styleEl);

    const syncRouteClasses = () => {
      document.body.classList.toggle("admin-route", isAdmin());
      document.body.classList.toggle("legal-route", isLegalPage());
    };
    syncRouteClasses();
    window.addEventListener("popstate", syncRouteClasses);
    const intervalId = window.setInterval(syncRouteClasses, 1000);

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("copy", blockCopy);
    document.addEventListener("dragstart", blockDragStart);

    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("dragstart", blockDragStart);
      window.removeEventListener("popstate", syncRouteClasses);
      window.clearInterval(intervalId);
      styleEl.remove();
      document.body.classList.remove("admin-route", "legal-route");
    };
  }, []);

  return null;
};

export default AntiScrape;
