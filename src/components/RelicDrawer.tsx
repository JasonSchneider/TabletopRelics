import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBle, type DeviceView } from "../ble/useBle";
import { BatteryIcon } from "./BatteryIcon";
import { CompassControlPanel } from "./CompassControlPanel";

function relicRoute(type: string): string {
  switch (type) {
    case "compass":      return "/compass";
    case "lantern":      return "/lantern";
    case "fairy-stones": return "/fairy-stones";
    default:             return "/";
  }
}

function relicLabel(type: string): string {
  switch (type) {
    case "compass":      return "Magic Compass";
    case "lantern":      return "Haunted Lantern";
    case "fairy-stones": return "Fairy Stones";
    default:             return "Relic";
  }
}

function DeviceControls({ device }: { device: DeviceView }) {
  if (device.info.type === "compass") {
    return (
      <CompassControlPanel
        connected={true}
        send={device.send}
        sendFast={device.sendFast}
      />
    );
  }
  return (
    <div className="text-center py-10 space-y-2">
      <p className="text-sm text-relic-parchment/50">
        Quick controls aren't available for this device type yet.
      </p>
      <Link
        to={relicRoute(device.info.type)}
        className="btn-primary text-sm inline-block mt-2"
      >
        Open full controls
      </Link>
    </div>
  );
}

export function RelicDrawer() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { devices, connect, status } = useBle();

  const connecting = status === "connecting";

  // When a new device connects, auto-select it and keep the drawer showing.
  useEffect(() => {
    if (devices.length === 0) {
      setSelectedId(null);
      return;
    }
    // If nothing is selected, or the selected device just disappeared, pick the first.
    if (!selectedId || !devices.find(d => d.id === selectedId)) {
      setSelectedId(devices[0].id);
    }
  }, [devices, selectedId]);

  const selected = devices.find(d => d.id === selectedId) ?? devices[0] ?? null;
  const tabDevice = selected ?? null;

  // The FAB label: device name if one is connected, generic otherwise.
  const fabLabel = selected ? relicLabel(selected.info.type) : "Relic";
  const fabConnected = devices.length > 0;

  return (
    <>
      {/* Right-edge tab */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open relic controls"
        className={[
          "fixed right-0 top-1/2 -translate-y-1/2 z-40",
          "flex flex-col items-center gap-2 py-4 px-2.5",
          "rounded-l-xl border border-r-0 border-white/10",
          "bg-relic-ink/90 backdrop-blur-sm shadow-xl",
          "hover:bg-relic-ink transition-colors select-none",
        ].join(" ")}
      >
        <span className={[
          "w-2 h-2 rounded-full shrink-0",
          fabConnected
            ? "bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"
            : "bg-white/20",
        ].join(" ")} />
        <span
          className="text-[11px] font-display tracking-widest text-relic-parchment/70 uppercase leading-none"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {fabLabel}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" className="text-relic-parchment/30 shrink-0">
          <path d="M3 2 L7 5 L3 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={[
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Drawer panel */}
      <div
        className={[
          "fixed inset-y-0 right-0 z-50 w-80 sm:w-96 flex flex-col",
          "bg-relic-ink border-l border-white/10 shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <p className="font-display text-base text-relic-parchment">
            {devices.length > 0 ? "Relics" : "No relic bonded"}
          </p>
          <div className="flex items-center gap-2">
            {/* Add another device */}
            <button
              onClick={connect}
              disabled={connecting}
              title="Bond another relic"
              className="text-xs px-2 py-1 rounded border border-white/10 text-relic-parchment/50 hover:text-relic-parchment hover:border-white/20 transition-colors disabled:opacity-40"
            >
              {connecting ? "Connecting…" : "+ Relic"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-relic-parchment/40 hover:text-relic-parchment hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Device tabs — shown when more than one device is connected */}
        {devices.length > 1 && (
          <div className="shrink-0 flex gap-1 px-3 pt-3 pb-0 overflow-x-auto">
            {devices.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs whitespace-nowrap transition-colors border-b-2",
                  d.id === selected?.id
                    ? "bg-white/5 text-relic-parchment border-relic-glow/60"
                    : "text-relic-parchment/50 hover:text-relic-parchment border-transparent",
                ].join(" ")}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
                {d.device.name}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {tabDevice ? (
            <>
              {/* Selected device info */}
              <div className="flex items-start justify-between mb-5 pb-4 border-b border-white/8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse shrink-0" />
                    <p className="font-display text-sm text-relic-parchment">{tabDevice.device.name}</p>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-relic-parchment/60 mt-0.5 ml-4">
                    <BatteryIcon percent={tabDevice.battery} charging={(tabDevice.state as any)?.charging ?? false} />
                    <span>{tabDevice.battery !== null ? `${tabDevice.battery}%` : "–"}</span>
                    {(tabDevice.state as any)?.charging && <span className="text-amber-400">Charging</span>}
                    <span className="text-relic-parchment/30">·</span>
                    <span>{relicLabel(tabDevice.info.type)}</span>
                  </p>
                </div>
                <button
                  onClick={tabDevice.disconnect}
                  className="text-[11px] text-relic-parchment/30 hover:text-relic-parchment/60 transition-colors mt-0.5"
                >
                  Disconnect
                </button>
              </div>
              <DeviceControls device={tabDevice} />
            </>
          ) : (
            <div className="text-center py-10 space-y-4">
              <p className="text-relic-parchment/50 text-sm leading-relaxed">
                Bond a relic to control it while you run the adventure.
              </p>
              <button
                onClick={connect}
                disabled={connecting}
                className="btn-primary text-sm"
              >
                {connecting ? "Connecting…" : "Connect a relic"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {tabDevice && (
          <div className="shrink-0 px-5 py-3 border-t border-white/10">
            <Link
              to={relicRoute(tabDevice.info.type)}
              onClick={() => setOpen(false)}
              className="text-xs text-relic-parchment/40 hover:text-relic-parchment/70 transition-colors"
            >
              Open full controls →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
