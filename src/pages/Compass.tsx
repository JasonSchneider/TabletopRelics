import { useBle } from "../ble/useBle";
import { RelicAdventures } from "../components/RelicAdventures";
import { BatteryIcon } from "../components/BatteryIcon";
import { CompassControlPanel } from "../components/CompassControlPanel";

export function Compass() {
  const { status, state, battery, send, sendFast } = useBle();
  const connected = status === "connected";
  const compassState = state?.type === "compass" ? state : null;
  const charging = compassState?.charging ?? false;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-relic-rune font-display text-sm tracking-widest uppercase">Relic I</p>
        <h1 className="text-3xl sm:text-4xl">Magic Compass</h1>
        {connected && (
          <span className="flex items-center gap-1.5 text-xs text-relic-parchment/60">
            <BatteryIcon percent={battery} charging={charging} />
            <span>{battery !== null ? `${battery}%` : "–"}</span>
            {charging && <span className="text-amber-400 font-medium">· Charging</span>}
          </span>
        )}
        <p className="text-relic-parchment/70 text-sm sm:text-base max-w-2xl">
          Point the needle at any bearing, run light effects, or let it drift
          to ambient mode. Connect a compass relic to send commands.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[auto,1fr] items-start">
        {/* Dial */}
        <div className="card p-6 flex flex-col items-center gap-4 mx-auto">
          <CompassDial
            heading={compassState?.heading ?? 0}
            target={0}
            color={undefined}
          />
          <div className="text-center">
            <p className="text-3xl font-display text-relic-rune">
              {Math.round(compassState?.heading ?? 0)}°
            </p>
            <p className="text-xs text-relic-parchment/50">current heading</p>
          </div>
        </div>

        {/* Controls */}
        <div className="card p-6">
          <CompassControlPanel connected={status === "connected"} send={send} sendFast={sendFast} />
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
