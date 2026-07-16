import "./lib/session-bootstrap";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Deter casual image downloading: block right-click and drag on <img> elements.
// (Determined users can still get images via DevTools / network tab.)
if (typeof window !== "undefined") {
  document.addEventListener("contextmenu", (e) => {
    if ((e.target as HTMLElement)?.tagName === "IMG") e.preventDefault();
  });
  document.addEventListener("dragstart", (e) => {
    if ((e.target as HTMLElement)?.tagName === "IMG") e.preventDefault();
  });
}

// Auto-recover from stale chunk errors after a redeploy.
if (typeof window !== "undefined") {
  const isChunkError = (msg: string) =>
    /Importing a module script failed|Failed to fetch dynamically imported module|Loading chunk \d+ failed/i.test(msg);
  const reloadOnce = () => {
    const key = "__lovable_chunk_reload";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    window.location.reload();
  };
  window.addEventListener("error", (e) => {
    if (e?.message && isChunkError(e.message)) reloadOnce();
  });
  window.addEventListener("unhandledrejection", (e) => {
    const msg = String((e as PromiseRejectionEvent).reason?.message ?? "");
    if (isChunkError(msg)) reloadOnce();
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
// trigger redeploy 2026-07-16T23:09:38Z
