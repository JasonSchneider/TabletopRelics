import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdventures } from "../adventures";
import type { Adventure } from "../adventures/types";
import type { DeviceType } from "../ble/protocol";

type Filter = "all" | DeviceType | "general";

const FILTERS: { value: Filter; label: string; accent: string }[] = [
  { value: "all", label: "All", accent: "text-relic-parchment" },
  { value: "compass", label: "Compass", accent: "text-relic-rune" },
  { value: "lantern", label: "Lantern", accent: "text-relic-ember" },
  { value: "fairy-stones", label: "Fairy Stones", accent: "text-relic-glow" },
  { value: "general", label: "General quests", accent: "text-relic-parchment/80" },
];

function matchesFilter(adv: Adventure, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "general") return adv.relic === null;
  return adv.relic === filter;
}

export function Adventures() {
  const [filter, setFilter] = useState<Filter>("all");
  const all = useMemo(() => getAdventures(), []);
  const visible = useMemo(
    () => all.filter((a) => matchesFilter(a, filter)),
    [all, filter],
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-relic-rune font-display text-sm tracking-widest uppercase">
          The Library
        </p>
        <h1 className="text-3xl sm:text-4xl">Adventure Modules</h1>
        <p className="text-relic-parchment/70 text-sm sm:text-base max-w-2xl">
          Prewritten one-shots and side quests, ready to run at your table.
          Adventures associated with a relic introduce or feature that prop;
          general quests slot into any campaign.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={[
              "text-xs sm:text-sm px-3 py-1.5 rounded-full border transition-colors",
              filter === f.value
                ? "bg-relic-glow/20 border-relic-glow/40 text-relic-parchment"
                : "bg-white/5 border-white/10 text-relic-parchment/70 hover:bg-white/10",
            ].join(" ")}
          >
            <span className={f.accent}>{f.label}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card p-6 text-center text-relic-parchment/60 text-sm">
          No adventures match this filter yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((adv) => (
            <AdventureCard key={adv.id} adventure={adv} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdventureCard({ adventure }: { adventure: Adventure }) {
  const relicLabel = relicNameOf(adventure.relic);
  const relicAccent = relicAccentOf(adventure.relic);

  return (
    <Link
      to={`/adventures/${adventure.id}`}
      className="block focus:outline-none focus:ring-2 focus:ring-relic-glow rounded-2xl"
    >
      <article className="card p-5 sm:p-6 h-full flex flex-col gap-3 transition-transform hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg sm:text-xl text-relic-parchment leading-tight">
            {adventure.title}
          </h2>
          {relicLabel && (
            <span
              className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${relicAccent}`}
            >
              {relicLabel}
            </span>
          )}
        </div>

        <p className="text-sm text-relic-parchment/70 flex-1">
          {adventure.summary}
        </p>

        <dl className="grid grid-cols-3 gap-2 text-[11px] text-relic-parchment/60 pt-2 border-t border-white/5">
          <div>
            <dt className="uppercase tracking-wider text-relic-parchment/40">
              Level
            </dt>
            <dd className="text-relic-parchment/80">{adventure.level}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider text-relic-parchment/40">
              Party
            </dt>
            <dd className="text-relic-parchment/80">{adventure.partySize}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider text-relic-parchment/40">
              Length
            </dt>
            <dd className="text-relic-parchment/80">{adventure.duration}</dd>
          </div>
        </dl>

        {adventure.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {adventure.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-relic-parchment/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}

function relicNameOf(relic: DeviceType | null): string | null {
  switch (relic) {
    case "compass":
      return "Compass";
    case "lantern":
      return "Lantern";
    case "fairy-stones":
      return "Fairy Stones";
    case "unknown":
    case null:
      return null;
  }
}

function relicAccentOf(relic: DeviceType | null): string {
  switch (relic) {
    case "compass":
      return "text-relic-rune";
    case "lantern":
      return "text-relic-ember";
    case "fairy-stones":
      return "text-relic-glow";
    default:
      return "text-relic-parchment/50";
  }
}
