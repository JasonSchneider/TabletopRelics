import { useState } from "react";
import { Link } from "react-router-dom";
import { useBle } from "../ble/useBle";
import { BatteryIcon } from "./BatteryIcon";
import { CompassControlPanel } from "./CompassControlPanel";

function relicRoute(type: string): string {
  switch (type) {
    case "compass":     return "/compass";
    case "lantern":     return "/lantern";
    case "fairy-stones": return "/fairy-stones";
    default:            return "/";
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

export function RelicDrawer() {
  const [open, setOpen] = useState(false);
  const { status, device, info, battery, state, connect } = useBle();
  const connected = status === "connected";
  const charging = (state as any)?.charging ?? false;

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
          "hover:bg-relic-ink transition-colors",
          "select-none",
        ].join(" ")}
      >
        {/* Status dot */}
        <span className={[
          "w-2 h-2 rounded-full shrink-0",
          connected
            ? "bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"
            : "bg-white/20",
        ].join(" ")} />

        {/* Vertical label */}
        <span
          className="text-[11px] font-display tracking-widest text-relic-parchment/70 uppercase leading-none"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {connected && info ? relicLabel(info.type) : "Relic"}
        </span>

        {/* Chevron hint */}
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
        {/* Drawer header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10 shrink-0">
          <div className="min-w-0">
            {connected && device && info ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse shrink-0" />
                  <p className="font-display text-base text-relic-parchment truncate">{device.name}</p>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-relic-parchment/60 mt-0.5 ml-4">
                  <BatteryIcon percent={battery} charging={charging} />
                  <span>{battery !== null ? `${battery}%` : "–"}</span>
                  {charging && <span className="text-amber-400">· Charging</span>}
                  <span className="text-relic-parchment/30">·</span>
                  <span>{relicLabel(info.type)}</span>
                </p>
              </>
            ) : (
              <p className="font-display text-base text-relic-parchment/50">No relic bonded</p>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-relic-parchment/40 hover:text-relic-parchment hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {info?.type === "compass" ? (
            <CompassControlPanel />
          ) : connected ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm text-relic-parchment/50">
                No quick controls available for this device type yet.
              </p>
              <Link
                to={relicRoute(info?.type ?? "")}
                onClick={() => setOpen(false)}
                className="btn-primary text-sm inline-block mt-2"
              >
                Open full controls
              </Link>
            </div>
          ) : (
            <div className="text-center py-10 space-y-4">
              <p className="text-relic-parchment/50 text-sm leading-relaxed">
                Bond a relic to control it while you run the adventure.
              </p>
              <button
                onClick={() => { connect(); setOpen(false); }}
                disabled={status === "connecting"}
                className="btn-primary text-sm"
              >
                {status === "connecting" ? "Connecting…" : "Connect a relic"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {connected && info && (
          <div className="shrink-0 px-5 py-3 border-t border-white/10">
            <Link
              to={relicRoute(info.type)}
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
