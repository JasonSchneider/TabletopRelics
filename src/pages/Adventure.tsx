import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAdventureById } from "../adventures";
import { RelicDrawer } from "../components/RelicDrawer";
import type { DeviceType } from "../ble/protocol";

export function Adventure() {
  const { id } = useParams<{ id: string }>();
  const adventure = useMemo(
    () => (id ? getAdventureById(id) : undefined),
    [id],
  );

  if (!adventure) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-3xl">No such adventure</h1>
        <p className="text-relic-parchment/60">
          The shelf is bare where this scroll should be.
        </p>
        <Link to="/adventures" className="btn-primary">
          Back to the library
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-8">
      <RelicDrawer />
      <header className="space-y-3">
        <Link
          to="/adventures"
          className="text-xs text-relic-parchment/60 hover:text-relic-parchment"
        >
          ← Library
        </Link>
        <h1 className="text-3xl sm:text-5xl text-relic-parchment">
          {adventure.title}
        </h1>
        <p className="text-relic-parchment/70 text-base sm:text-lg max-w-3xl italic">
          {adventure.summary}
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-relic-parchment/60 pt-2">
          <Stat label="Level" value={adventure.level} />
          <Stat label="Party" value={adventure.partySize} />
          <Stat label="Length" value={adventure.duration} />
          {adventure.relic && (
            <Stat label="Relic" value={prettyRelic(adventure.relic)} />
          )}
          <Stat label="Type" value={prettyKind(adventure.kind)} />
        </div>

        {adventure.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {adventure.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-relic-parchment/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="card p-6 sm:p-10 prose-relic">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {adventure.content}
        </ReactMarkdown>
      </div>

      {adventure.relic && (
        <div className="card p-5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-relic-parchment/50">
              Run this at the table
            </p>
            <p className="text-sm text-relic-parchment/80">
              Pair the {prettyRelic(adventure.relic)} relic and trigger its
              behaviors right from your phone.
            </p>
          </div>
          <Link to={relicRouteOf(adventure.relic)} className="btn-primary">
            Open {prettyRelic(adventure.relic)} controls
          </Link>
        </div>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="uppercase tracking-wider text-relic-parchment/40">
        {label}:{" "}
      </span>
      <span className="text-relic-parchment/80">{value}</span>
    </span>
  );
}

function prettyRelic(relic: DeviceType): string {
  switch (relic) {
    case "compass":
      return "Magic Compass";
    case "lantern":
      return "Haunted Lantern";
    case "fairy-stones":
      return "Fairy Stones";
    default:
      return "Relic";
  }
}

function prettyKind(kind: string): string {
  switch (kind) {
    case "intro":
      return "Relic introduction";
    case "uses-relic":
      return "Uses a relic";
    case "general":
      return "General quest";
    default:
      return kind;
  }
}

function relicRouteOf(relic: DeviceType): string {
  switch (relic) {
    case "compass":
      return "/compass";
    case "lantern":
      return "/lantern";
    case "fairy-stones":
      return "/fairy-stones";
    default:
      return "/";
  }
}
