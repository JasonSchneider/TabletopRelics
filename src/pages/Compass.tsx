import { useState } from "react";
import { useBle } from "../ble/useBle";
import { RelicAdventures } from "../components/RelicAdventures";

export function Compass() {
  const { status, send, state } = useBle();
  const connected = status === "connected";
  const compassState = state?.type === "compass" ? state : null;

  const [target, setTarget] = useState<number>(0);

  const isBusy = !connected;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-relic-rune font-display text-sm tracking-widest uppercase">Relic I</p>
        <h1 className="text-3xl sm:text-4xl">Magic Compass</h1>
        <p className="text-relic-parchment/70 text-sm sm:text-base max-w-2xl">
          Point the needle at any bearing, calibrate the magnetometer, or let
          it drift to ambient mode. Connect a compass relic to begin.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[auto,1fr] items-start">
        <div className="card p-6 flex flex-col items-center gap-4 mx-auto">
          <CompassDial heading={compassState?.heading ?? 0} target={compassState?.target ?? target} />
          <div className="text-center">
            <p className="text-3xl font-display text-relic-rune">
              {Math.round(compassState?.heading ?? 0)}°
            </p>
            <p className="text-xs text-relic-parchment/50">current heading</p>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-wider text-relic-parchment/60">
              Target bearing
            </label>
            <input
              type="range"
              min={0}
              max={359}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full mt-2 accent-relic-glow"
            />
            <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
              <span>0°</span>
              <span className="text-relic-rune font-display text-base">{target}°</span>
              <span>359°</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              disabled={isBusy}
              onClick={() => send({ op: "compass.setTarget", bearing: target })}
              className="btn-primary"
            >
              Send target
            </button>
            <button
              disabled={isBusy}
              onClick={() => send({ op: "compass.setMode", mode: "quest" })}
              className="btn-ghost"
            >
              Quest mode
            </button>
            <button
              disabled={isBusy}
              onClick={() => send({ op: "compass.setMode", mode: "ambient" })}
              className="btn-ghost"
            >
              Ambient
            </button>
            <button
              disabled={isBusy}
              onClick={() => send({ op: "compass.calibrate" })}
              className="btn-ghost"
            >
              Calibrate
            </button>
          </div>

          {!connected && (
            <p className="text-sm text-relic-parchment/50">
              Connect a compass relic from the header to enable controls.
            </p>
          )}
        </div>
      </div>

      <RelicAdventures relic="compass" />
    </div>
  );
}

function CompassDial({ heading, target }: { heading: number; target: number }) {
  return (
    <svg viewBox="0 0 220 220" className="w-56 h-56 sm:w-72 sm:h-72">
      <defs>
        <radialGradient id="dialBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a0f2e" />
          <stop offset="100%" stopColor="#0a0612" />
        </radialGradient>
      </defs>
      <circle cx="110" cy="110" r="100" fill="url(#dialBg)" stroke="#d4af37" strokeWidth="2" />
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i * 10 * Math.PI) / 180;
        const x1 = 110 + Math.sin(angle) * 92;
        const y1 = 110 - Math.cos(angle) * 92;
        const x2 = 110 + Math.sin(angle) * (i % 9 === 0 ? 80 : 86);
        const y2 = 110 - Math.cos(angle) * (i % 9 === 0 ? 80 : 86);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#d4af37"
            strokeOpacity={i % 9 === 0 ? 0.9 : 0.3}
            strokeWidth={i % 9 === 0 ? 2 : 1}
          />
        );
      })}
      {/* Cardinal letters */}
      {(["N", "E", "S", "W"] as const).map((label, i) => {
        const a = (i * 90 * Math.PI) / 180;
        return (
          <text
            key={label}
            x={110 + Math.sin(a) * 70}
            y={110 - Math.cos(a) * 70 + 5}
            textAnchor="middle"
            className="font-display fill-relic-parchment"
            fontSize="14"
          >
            {label}
          </text>
        );
      })}
      {/* Target tick */}
      <g transform={`rotate(${target} 110 110)`}>
        <line x1="110" y1="20" x2="110" y2="32" stroke="#a78bfa" strokeWidth="3" />
      </g>
      {/* Needle */}
      <g
        transform={`rotate(${heading} 110 110)`}
        style={{ transition: "transform 200ms ease-out" }}
      >
        <path d="M110 30 L116 110 L110 116 L104 110 Z" fill="#f4ecd8" />
        <path d="M110 190 L116 110 L110 104 L104 110 Z" fill="#f59e0b" opacity="0.7" />
      </g>
      <circle cx="110" cy="110" r="5" fill="#d4af37" />
    </svg>
  );
}
