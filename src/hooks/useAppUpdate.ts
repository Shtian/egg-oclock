import { useEffect, useState } from "react";

/**
 * Tracks whether a newer build has taken over in the background. The service
 * worker activates new versions straight away (see pwa/sw.js), but this page is
 * still running the old code until it reloads.
 *
 * It also asks for an update whenever the app comes back to the foreground,
 * because iOS resumes home-screen apps without reloading them, so the browser's
 * own launch-time check might not run for days.
 */
export function useAppUpdate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;

    // The first install also fires controllerchange; only a replacement is an update.
    let hadController = Boolean(sw.controller);
    const onControllerChange = () => {
      if (hadController) setReady(true);
      hadController = true;
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      sw.getRegistration()
        .then((reg) => reg?.update())
        .catch(() => {});
    };

    sw.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      sw.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return { ready, reload: () => location.reload() };
}
