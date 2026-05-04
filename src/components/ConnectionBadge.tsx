import { useBle } from "../ble/useBle";

export function ConnectionBadge() {
  const { supported, status, devices, connect, disconnect } = useBle();

  if (!supported) {
    return (
      <span
        className="text-[11px] sm:text-xs px-2 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30"
        title="Web Bluetooth not available. Use Chrome/Edge on desktop, Chrome on Android, or wait for the iOS app."
      >
        BLE unavailable
      </span>
    );
  }

  if (status === "connected") {
    const count = devices.length;
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-relic-parchment/70">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          {count === 1 ? "1 Relic" : `${count} Relics`}
        </span>
        <button onClick={connect} className="btn-ghost text-xs px-2 py-1">
          + Add
        </button>
        <button onClick={disconnect} className="btn-ghost text-xs px-2 py-1">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={status === "connecting"}
      className="btn-primary text-xs sm:text-sm py-1.5 px-3"
    >
      {status === "connecting" ? "Connecting…" : "Connect Relic"}
    </button>
  );
}
