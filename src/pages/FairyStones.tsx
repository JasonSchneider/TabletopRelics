import { useState } from "react";
import { useBle } from "../ble/useBle";

const PATTERNS = ["breathe", "twinkle", "chase", "off"] as const;
type Pattern = (typeof PATTERNS)[number];

export function FairyStones() {
  const { status, send, state } = useBle();
  const connected = status === "connected";
  const stoneState = state?.type === "fairy-stones" ? state : null;
  const stones = stoneState?.connectedStones ?? [];

  const [pattern, setPattern] = useState<Pattern>("breathe");
  const [color, setColor] = useState("#a78bfa");

  const isBusy = !connected;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-relic-glow font-display text-sm tracking-widest uppercase">Relic III</p>
        <h1 className="text-3xl sm:text-4xl">Fairy Stones</h1>
        <p className="text-relic-parchment/70 text-sm sm:text-base max-w-2xl">
          A constellation of glowing stones that talk to each other. Set a
          shared pattern, then assign one as the leader to start the dance.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div className="card p-6">
          <p className="text-xs uppercase tracking-wider text-relic-parchment/60 mb-3">
            Connected stones {stones.length > 0 && `(${stones.length})`}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {(stones.length > 0 ? stones : ["?", "?", "?", "?"]).map((id, i) => (
              <Stone key={`${id}-${i}`} id={id} color={color} active={connected && stones.length > 0} />
            ))}
          </div>
          {!connected && (
            <p className="text-sm text-relic-parchment/50 mt-4">
              Connect to a fairy stone leader to see the rest of its flock.
            </p>
          )}
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-wider text-relic-parchment/60 block mb-2">
              Glow pattern
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PATTERNS.map((p) => (
                <button
                  key={p}
                  disabled={isBusy}
                  onClick={() => {
                    setPattern(p);
                    send({ op: "stones.setPattern", pattern: p });
                  }}
                  className={
                    pattern === p
                      ? "btn-primary capitalize"
                      : "btn-ghost capitalize"
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-relic-parchment/60">
              Stone color
            </label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                onBlur={() => {
                  if (!connected) return;
                  const v = color.replace("#", "");
                  send({
                    op: "stones.setColor",
                    r: parseInt(v.slice(0, 2), 16),
                    g: parseInt(v.slice(2, 4), 16),
                    b: parseInt(v.slice(4, 6), 16),
                  });
                }}
                className="w-12 h-10 rounded-md border border-white/10 bg-transparent cursor-pointer"
              />
              <span className="text-sm text-relic-parchment/70 font-mono">{color}</span>
            </div>
          </div>

          <p className="text-xs text-relic-parchment/40">
            Tip: hold one stone near another to teach them their roles. The leader
            broadcasts; followers echo.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stone({ id, color, active }: { id: string; color: string; active: boolean }) {
  return (
    <div className="aspect-square rounded-full flex items-center justify-center text-xs font-mono"
      style={{
        background: active
          ? `radial-gradient(circle at 35% 30%, ${color}cc, ${color}33 60%, transparent 75%)`
          : "rgba(255,255,255,0.05)",
        boxShadow: active ? `0 0 18px ${color}99` : "none",
        border: "1px solid rgba(255,255,255,0.1)",
        transition: "all 200ms ease-out",
      }}
    >
      <span className="text-relic-parchment/60">{id.slice(-3)}</span>
    </div>
  );
}
