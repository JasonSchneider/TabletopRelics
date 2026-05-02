import { useRef, useState } from "react";
import { useBle } from "../ble/useBle";
import { RelicAdventures } from "../components/RelicAdventures";

type TopMode = "ambient" | "quest" | "manual" | "calibrate";
type Effect  = "static" | "spin" | "pulse" | "random";

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

const COLOR_PRESETS = [
  { label: "Blue",    hex: "#00b4ff" },
  { label: "Gold",    hex: "#ffc800" },
  { label: "Green",   hex: "#00ff8c" },
  { label: "Violet",  hex: "#7800ff" },
  { label: "Red",     hex: "#ff2000" },
  { label: "White",   hex: "#ffffff" },
];

export function Compass() {
  const { status, send, sendFast, state } = useBle();
  const connected = status === "connected";
  const compassState = state?.type === "compass" ? state : null;

  const [target, setTarget]       = useState(0);
  const [color, setColor]         = useState("#00b4ff");
  const [speed, setSpeed]         = useState(50);
  const [randomColor, setRandomColor] = useState(false);
  const [topMode, setTopMode]     = useState<TopMode>("ambient");
  const [effect, setEffect]       = useState<Effect>("static");

  const bearingDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isManual = topMode === "manual";

  function switchTopMode(m: TopMode) {
    setTopMode(m);
    if (m === "calibrate") {
      send({ op: "compass.calibrate" });
    } else {
      const fm = m === "manual" ? (effect === "static" ? "manual" : effect) : m;
      send({ op: "compass.setMode", mode: fm as any });
    }
  }

  function switchEffect(e: Effect) {
    setEffect(e);
    const fm = e === "static" ? "manual" : e;
    send({ op: "compass.setMode", mode: fm as any });
    if (e !== "static") {
      send({ op: "compass.setSpeed", speed });
    }
  }

  function handleBearingChange(value: number) {
    setTarget(value);
    if (bearingDebounce.current) clearTimeout(bearingDebounce.current);
    bearingDebounce.current = setTimeout(() => {
      sendFast({ op: "compass.setTarget", bearing: value });
    }, 16); // ~60fps cap, no ACK wait
  }

  function handleSpeedChange(value: number) {
    setSpeed(value);
    sendFast({ op: "compass.setSpeed", speed: value });
  }

  function handleColorChange(hex: string) {
    setColor(hex);
    setRandomColor(false);
    const { r, g, b } = hexToRgb(hex);
    sendFast({ op: "compass.setColor", r, g, b });
  }

  function handleRandomColor(on: boolean) {
    setRandomColor(on);
    if (on) {
      send({ op: "compass.setColor", random: true });
    } else {
      const { r, g, b } = hexToRgb(color);
      send({ op: "compass.setColor", r, g, b });
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-relic-rune font-display text-sm tracking-widest uppercase">Relic I</p>
        <h1 className="text-3xl sm:text-4xl">Magic Compass</h1>
        <p className="text-relic-parchment/70 text-sm sm:text-base max-w-2xl">
          Point the needle at any bearing, run light effects, or let it drift
          to ambient mode. Connect a compass relic to begin.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[auto,1fr] items-start">
        {/* Dial */}
        <div className="card p-6 flex flex-col items-center gap-4 mx-auto">
          <CompassDial
            heading={compassState?.heading ?? 0}
            target={target}
            color={isManual && !randomColor ? color : undefined}
          />
          <div className="text-center">
            <p className="text-3xl font-display text-relic-rune">
              {Math.round(compassState?.heading ?? 0)}°
            </p>
            <p className="text-xs text-relic-parchment/50">current heading</p>
          </div>
        </div>

        {/* Controls */}
        <div className="card p-6 space-y-5">

          {/* Top-level mode */}
          <div>
            <p className="text-xs uppercase tracking-wider text-relic-parchment/60 mb-2">Mode</p>
            <div className="flex gap-2 flex-wrap">
              {(["ambient", "manual", "quest", "calibrate"] as TopMode[]).map((m) => (
                <button key={m} disabled={!connected} onClick={() => switchTopMode(m)}
                  className={[
                    "px-3 py-1.5 rounded-md text-sm capitalize transition-colors",
                    topMode === m
                      ? "bg-relic-glow/30 text-relic-parchment border border-relic-glow/50"
                      : "bg-white/5 text-relic-parchment/60 hover:text-relic-parchment hover:bg-white/10 border border-white/10",
                  ].join(" ")}
                >{m}</button>
              ))}
            </div>
          </div>

          {/* Manual controls */}
          {isManual && (
            <>
              {/* Effect selector */}
              <div>
                <p className="text-xs uppercase tracking-wider text-relic-parchment/60 mb-2">Effect</p>
                <div className="flex gap-2 flex-wrap">
                  {(["static", "spin", "pulse", "random"] as Effect[]).map((e) => (
                    <button key={e} disabled={!connected} onClick={() => switchEffect(e)}
                      className={[
                        "px-3 py-1.5 rounded-md text-sm capitalize transition-colors",
                        effect === e
                          ? "bg-relic-rune/40 text-relic-parchment border border-relic-rune/60"
                          : "bg-white/5 text-relic-parchment/60 hover:text-relic-parchment hover:bg-white/10 border border-white/10",
                      ].join(" ")}
                    >{e}</button>
                  ))}
                </div>
              </div>

              {/* Bearing — static only */}
              {effect === "static" && (
                <div>
                  <label className="text-xs uppercase tracking-wider text-relic-parchment/60">
                    Bearing (live)
                  </label>
                  <input type="range" min={0} max={359} value={target}
                    onChange={(e) => handleBearingChange(Number(e.target.value))}
                    className="w-full mt-2 accent-relic-glow"
                  />
                  <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
                    <span>0°</span>
                    <span className="text-relic-rune font-display text-base">{target}°</span>
                    <span>359°</span>
                  </div>
                </div>
              )}

              {/* Speed — animated effects */}
              {effect !== "static" && (
                <div>
                  <label className="text-xs uppercase tracking-wider text-relic-parchment/60">
                    Speed
                  </label>
                  <input type="range" min={1} max={100} value={speed}
                    onChange={(e) => handleSpeedChange(Number(e.target.value))}
                    className="w-full mt-2 accent-relic-glow"
                  />
                  <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
                    <span>Slow</span>
                    <span className="text-relic-rune font-display text-base">{speed}</span>
                    <span>Fast</span>
                  </div>
                </div>
              )}

              {/* Color */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider text-relic-parchment/60">
                    Color
                  </label>
                  <button
                    disabled={!connected}
                    onClick={() => handleRandomColor(!randomColor)}
                    className={[
                      "text-xs px-2 py-0.5 rounded border transition-colors",
                      randomColor
                        ? "bg-relic-rune/30 border-relic-rune/60 text-relic-parchment"
                        : "bg-white/5 border-white/10 text-relic-parchment/50 hover:text-relic-parchment",
                    ].join(" ")}
                  >
                    🎲 Random
                  </button>
                </div>
                <div className={`flex items-center gap-3 transition-opacity ${randomColor ? "opacity-30 pointer-events-none" : ""}`}>
                  <input type="color" value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_PRESETS.map(({ label, hex }) => (
                      <button key={hex} onClick={() => handleColorChange(hex)} title={label}
                        className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ backgroundColor: hex, borderColor: color === hex && !randomColor ? "#fff" : "transparent" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Quest mode */}
          {topMode === "quest" && (
            <div>
              <label className="text-xs uppercase tracking-wider text-relic-parchment/60">
                Target bearing
              </label>
              <input type="range" min={0} max={359} value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="w-full mt-2 accent-relic-glow"
              />
              <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
                <span>0°</span>
                <span className="text-relic-rune font-display text-base">{target}°</span>
                <span>359°</span>
              </div>
              <button disabled={!connected}
                onClick={() => send({ op: "compass.setTarget", bearing: target })}
                className="btn-primary mt-3 w-full"
              >
                Send target
              </button>
            </div>
          )}

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

function CompassDial({ heading, target, color }: {
  heading: number;
  target: number;
  color?: string;
}) {
  const tickColor = color ?? "#a78bfa";
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
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#d4af37" strokeOpacity={i % 9 === 0 ? 0.9 : 0.3}
          strokeWidth={i % 9 === 0 ? 2 : 1} />;
      })}
      {(["N", "E", "S", "W"] as const).map((label, i) => {
        const a = (i * 90 * Math.PI) / 180;
        return <text key={label} x={110 + Math.sin(a) * 70} y={110 - Math.cos(a) * 70 + 5}
          textAnchor="middle" className="font-display fill-relic-parchment" fontSize="14">{label}</text>;
      })}
      <g transform={`rotate(${target} 110 110)`}>
        <line x1="110" y1="20" x2="110" y2="32" stroke={tickColor} strokeWidth="3" />
      </g>
      <g transform={`rotate(${heading} 110 110)`} style={{ transition: "transform 200ms ease-out" }}>
        <path d="M110 30 L116 110 L110 116 L104 110 Z" fill="#f4ecd8" />
        <path d="M110 190 L116 110 L110 104 L104 110 Z" fill="#f59e0b" opacity="0.7" />
      </g>
      <circle cx="110" cy="110" r="5" fill="#d4af37" />
    </svg>
  );
}
