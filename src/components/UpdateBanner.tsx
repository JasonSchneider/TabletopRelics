import { useRegisterSW } from "virtual:pwa-register/react";

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-relic-ink border border-relic-glow/40 shadow-[0_0_24px_rgba(167,139,250,0.15)] text-sm text-relic-parchment whitespace-nowrap">
      <span className="text-relic-parchment/80">A new version is available.</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="btn-primary py-1 px-3 text-xs"
      >
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
