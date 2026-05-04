import { useEffect, useState } from "react";
import { useBle } from "../ble/useBle";

/**
 * Full-screen overlay that appears automatically when a previously paired
 * relic is known but not connected. Waits briefly so the silent
 * getDevices() auto-reconnect can succeed first; if it doesn't, this
 * prompts the user with a single tap.
 */
export function ReconnectOverlay() {
  const { status, lastKnownName, connect, dismissReconnect } = useBle();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "idle" && lastKnownName) {
      // Give the silent getDevices() path ~1.5 s to succeed before showing.
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
    // Hide whenever we leave idle (connecting or connected).
    setVisible(false);
  }, [status, lastKnownName]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-relic-shadow border border-relic-glow/20 rounded-2xl p-8 max-w-xs w-full mx-4 text-center space-y-6 shadow-[0_0_60px_rgba(167,139,250,0.12)]">

        {/* Pulsing rune ring */}
        <div className="w-20 h-20 mx-auto rounded-full border border-relic-glow/30 flex items-center justify-center animate-pulse">
          <svg viewBox="0 0 32 32" className="w-10 h-10" aria-hidden="true">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#a78bfa" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="8" fill="none" stroke="#d4af37" strokeWidth="0.75" strokeDasharray="2 3" />
            <circle cx="16" cy="16" r="3" fill="#d4af37" />
            <path d="M16 4 L18 14 L16 16 L14 14 Z" fill="#f4ecd8" opacity="0.7" />
          </svg>
        </div>

        <div>
          <h2 className="font-display text-relic-parchment text-xl tracking-wide">
            Relic Unbound
          </h2>
          <p className="text-relic-parchment/50 text-sm mt-1">{lastKnownName}</p>
        </div>

        <button
          onClick={connect}
          className="btn-primary w-full py-3 text-base"
        >
          Reconnect
        </button>

        <button
          onClick={dismissReconnect}
          className="block w-full text-xs text-relic-parchment/25 hover:text-relic-parchment/50 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
