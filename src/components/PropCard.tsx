import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface PropCardProps {
  to: string;
  title: string;
  tagline: string;
  accent: string; // tailwind text color class
  glyph: ReactNode;
  available: boolean;
}

export function PropCard({ to, title, tagline, accent, glyph, available }: PropCardProps) {
  const inner = (
    <article className="card p-5 sm:p-6 h-full flex flex-col gap-3 transition-transform hover:-translate-y-0.5">
      <div className={`w-12 h-12 ${accent}`}>{glyph}</div>
      <h2 className="font-display text-xl sm:text-2xl text-relic-parchment">
        {title}
      </h2>
      <p className="text-sm text-relic-parchment/70 flex-1">{tagline}</p>
      <div className="flex items-center justify-between pt-2">
        <span
          className={
            available
              ? "text-xs text-emerald-400/80"
              : "text-xs text-relic-parchment/40"
          }
        >
          {available ? "Ready" : "Coming soon"}
        </span>
        <span className="text-xs text-relic-parchment/60">Open →</span>
      </div>
    </article>
  );

  return (
    <Link to={to} className="block focus:outline-none focus:ring-2 focus:ring-relic-glow rounded-2xl">
      {inner}
    </Link>
  );
}
