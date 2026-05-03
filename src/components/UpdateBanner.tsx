import { useRegisterSW } from "virtual:pwa-register/react";

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;

      // Check for updates every 60 s
      const check = () => registration.update().catch(() => {});
      const interval = setInterval(check, 60_000);

      // Also check when the tab becomes visible again (handles mobile backgrounding)
      const onVisible = () => {
        if (document.visibilityState === "visible") check();
      };
      document.addEventListener("visibilitychange", onVisible);

      // Cleanup is not strictly necessary for a singleton service worker,
      // but keeps this correct if the component ever unmounts.
      return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", onVisible);
      };
    },
  });

  if (!needRefresh) return null;

  function handleRefresh() {
    updateServiceWorker(true);
    // Give the SW a moment to activate, then hard-reload regardless.
    setTimeout(() => window.location.reload(), 300);
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-relic-ink border border-relic-glow/40 shadow-[0_0_24px_rgba(167,139,250,0.15)] text-sm text-relic-parchment whitespace-nowrap">
      <span className="text-relic-parchment/80">A new version is available.</span>
      <button onClick={handleRefresh} className="btn-primary py-1 px-3 text-xs">
        Refresh
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="text-relic-parchment/40 hover:text-relic-parchment/70 text-xs transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}
