import type { ReactNode } from "react";
import type { DeviceType } from "../ble/protocol";

/**
 * Stylized SVG illustration shown on store cards. Reuses the same
 * visual language as the prop-page glyphs but at a larger scale and
 * with a colored backplate so they read as "products" in the store.
 */
export function ProductGlyph({ relic }: { relic: DeviceType }) {
  switch (relic) {
    case "compass":
      return (
        <Frame accent="rune">
          <svg viewBox="0 0 100 100" className="w-20 h-20 text-relic-rune">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 4" />
            <path d="M50 14 L57 50 L50 56 L43 50 Z" fill="currentColor" />
            <path d="M50 86 L57 50 L50 44 L43 50 Z" fill="currentColor" opacity="0.4" />
            <circle cx="50" cy="50" r="3.5" fill="currentColor" />
          </svg>
        </Frame>
      );
    case "lantern":
      return (
        <Frame accent="ember">
          <svg viewBox="0 0 100 100" className="w-20 h-20 text-relic-ember">
            <path d="M35 22 H65 V26 H35 Z" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M30 26 L70 26 L66 80 L34 80 Z" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M50 38 C 44 48 44 60 50 70 C 56 60 56 48 50 38 Z" fill="currentColor" opacity="0.85" />
            <path d="M50 16 V22" stroke="currentColor" strokeWidth="2" />
            <path d="M44 80 V86 M56 80 V86" stroke="currentColor" strokeWidth="2" />
          </svg>
        </Frame>
      );
    case "fairy-stones":
      return (
        <Frame accent="glow">
          <svg viewBox="0 0 100 100" className="w-20 h-20 text-relic-glow">
            <circle cx="28" cy="62" r="10" fill="currentColor" fillOpacity="0.7" />
            <circle cx="58" cy="32" r="8" fill="currentColor" fillOpacity="0.7" />
            <circle cx="74" cy="66" r="12" fill="currentColor" fillOpacity="0.7" />
            <circle cx="42" cy="40" r="5" fill="currentColor" fillOpacity="0.5" />
            <path
              d="M28 62 L58 32 L74 66 L42 40 Z"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          </svg>
        </Frame>
      );
    default:
      return <Frame accent="rune">?</Frame>;
  }
}

function Frame({
  accent,
  children,
}: {
  accent: "rune" | "ember" | "glow";
  children: ReactNode;
}) {
  const bg = {
    rune: "bg-relic-rune/10 ring-relic-rune/20",
    ember: "bg-relic-ember/10 ring-relic-ember/20",
    glow: "bg-relic-glow/10 ring-relic-glow/20",
  }[accent];
  return (
    <div
      className={`aspect-square w-full rounded-xl ring-1 ${bg} flex items-center justify-center`}
    >
      {children}
    </div>
  );
}
