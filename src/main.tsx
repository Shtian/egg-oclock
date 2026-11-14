import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/young-serif/latin.css";
import "@fontsource/young-serif/latin-ext.css";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "./index.css";
import App from "./App.tsx";
import { newId } from "./lib/id";
import { hasSharedOrder, linesFromSearch } from "./lib/share";

/** Reads an order from a shared link once, then cleans the URL so a reload doesn't import it again. */
function takeSharedOrder() {
  if (!hasSharedOrder(location.search)) return null;
  const lines = linesFromSearch(location.search, newId);
  history.replaceState(history.state, "", location.pathname + location.hash);
  return lines.length > 0 ? lines : null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App shared={takeSharedOrder()} />
  </StrictMode>,
);

// Cache the app for offline use once installed to the home screen (production only,
// so the dev server never gets stuck behind a stale cache).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
