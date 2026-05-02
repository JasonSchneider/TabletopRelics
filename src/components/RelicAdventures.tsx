import { Link } from "react-router-dom";
import { getAdventuresForRelic } from "../adventures";
import type { DeviceType } from "../ble/protocol";

/**
 * Small rail shown on each prop page that lists every adventure
 * associated with that relic. Stays out of the way when there are no
 * adventures yet for a given prop.
 */
export function RelicAdventures({ relic }: { relic: DeviceType }) {
  const adventures = getAdventuresForRelic(relic);
  if (adventures.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl text-relic-parchment">
        Adventures featuring this relic
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {adventures.map((adv) => (
          <Link
            key={adv.id}
            to={`/adventures/${adv.id}`}
            className="card p-4 block hover:-translate-y-0.5 transition-transform focus:outline-none focus:ring-2 focus:ring-relic-glow"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-base text-relic-parchment">
                {adv.title}
              </h3>
              <span className="text-[10px] uppercase tracking-wider text-relic-parchment/50 whitespace-nowrap">
                {adv.duration}
              </span>
            </div>
            <p className="text-sm text-relic-parchment/70 mt-1 line-clamp-3">
              {adv.summary}
            </p>
            <p className="text-[11px] text-relic-parchment/50 mt-2">
              Level {adv.level} · {adv.partySize}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
