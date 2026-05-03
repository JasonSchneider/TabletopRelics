import { useBle } from "../ble/useBle";

export function ConnectionBadge() {
  const { supported, status, device, battery, state, connect, disconnect } = useBle();
  const charging = state?.charging ?? false;

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

  if (status === "connected" && device) {
    return (
      <div className="flex items-center gap-2">
        {/* Device name — hidden on small screens to save space */}
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-relic-parchment/70">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          {device.name}
        </span>
        {/* Battery — always visible */}
        {battery !== null && (
          <span className="flex items-center gap-1 text-xs text-relic-parchment/60">
            <BatteryIcon percent={battery} charging={charging} />
            <span>{battery}%</span>
            {charging && (
              <span className="text-amber-400 text-[10px] font-medium">Charging</span>
            )}
          </span>
        )}
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

function BatteryIcon({ percent, charging }: { percent: number; charging: boolean }) {
  const fillColor =
    percent > 60 ? "#34d399" : percent > 30 ? "#fbbf24" : "#f87171";
  const fillWidth = Math.round((percent / 100) * 14);
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true" className="inline-block">
      {/* body */}
      <rect x="0.5" y="0.5" width="19" height="11" rx="2"
        fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
      {/* terminal nub */}
      <rect x="20" y="3.5" width="3" height="5" rx="1"
        fill="currentColor" fillOpacity="0.35" />
      {/* charge fill */}
      <rect x="2" y="2" width={fillWidth} height="8" rx="1" fill={fillColor} />
      {/* charging bolt */}
      {charging && (
        <path d="M11 1.5 L7.5 6.5 L10.5 6.5 L9 10.5 L14 5 L11 5 Z"
          fill="white" fillOpacity="0.9" />
      )}
    </svg>
  );
}
