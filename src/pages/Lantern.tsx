import { useState } from "react";
import { useBle } from "../ble/useBle";

export function Lantern() {
  const { status, send, state } = useBle();
  const connected = status === "connected";
  const lanternState = state?.type === "lantern" ? state : null;

  const [intensity, setIntensity] = useState(60);
  const [color, setColor] = useState("#f59e0b");

  const isBusy = !connected;
  const rgb = hexToRgb(color);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-relic-ember font-display text-sm tracking-widest uppercase">Relic II</p>
        <h1 className="text-3xl sm:text-4xl">Haunted Lantern</h1>
        <p className="text-relic-parchment/70 text-sm sm:text-base max-w-2xl">
          Coax the flame, change its hue, or summon a triggered effect. Best
          played in dim light with the volume up.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[auto,1fr] items-start">
        <div className="card p-6 flex flex-col items-center gap-4 mx-auto">
          <Flame intensity={lanternState?.intensity ?? intensity} hex={color} />
          <p className="text-xs text-relic-parchment/50">live preview</p>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-wider text-relic-parchment/60">
              Flame intensity
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              onMouseUp={() => connected && send({ op: "lantern.setFlame", intensity })}
              onTouchEnd={() => connected && send({ op: "lantern.setFlame", intensity })}
              className="w-full mt-2 accent-relic-ember"
            />
            <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
              <span>guttering</span>
              <span className="text-relic-ember font-display text-base">{intensity}%</span>
              <span>roaring</span>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-relic-parchment/60">
              Flame color
            </label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                onBlur={() => connected && send({ op: "lantern.setColor", ...rgb })}
                className="w-12 h-10 rounded-md border border-white/10 bg-transparent cursor-pointer"
              />
              <span className="text-sm text-relic-parchment/70 font-mono">{color}</span>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-relic-parchment/60 block mb-2">
              Trigger effect
            </label>
            <div className="flex flex-wrap gap-2">
              {(["flicker", "ghost", "wind", "snuff"] as const).map((effect) => (
                <button
                  key={effect}
                  disabled={isBusy}
                  onClick={() => send({ op: "lantern.trigger", effect })}
                  className="btn-ghost capitalize"
                >
                  {effect}
                </button>
              ))}
            </div>
          </div>

          {!connected && (
            <p className="text-sm text-relic-parchment/50">
              Connect a lantern relic from the header to enable controls.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Flame({ intensity, hex }: { intensity: number; hex: string }) {
  const scale = 0.6 + (intensity / 100) * 0.7;
  return (
    <div className="relative w-40 h-56 sm:w-48 sm:h-64 flex items-end justify-center">
      <div
        className="absolute bottom-8 rounded-full blur-2xl opacity-70"
        style={{
          width: `${80 * scale}px`,
          height: `${120 * scale}px`,
          background: `radial-gradient(circle, ${hex} 0%, transparent 70%)`,
          transition: "all 200ms ease-out",
        }}
      />
      <svg viewBox="0 0 80 120" className="relative w-24 h-36">
        <path
          d="M40 0 C 28 30 28 50 40 70 C 52 50 52 30 40 0 Z"
          fill={hex}
          opacity={0.4 + (intensity / 100) * 0.6}
        />
        <path
          d="M40 20 C 33 40 33 55 40 70 C 47 55 47 40 40 20 Z"
          fill="#fff7d6"
          opacity={0.5 + (intensity / 100) * 0.5}
        />
      </svg>
    </div>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}
