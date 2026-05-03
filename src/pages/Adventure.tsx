import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import { getAdventureById } from "../adventures";
import { RelicDrawer } from "../components/RelicDrawer";
import { useBle } from "../ble/useBle";
import type { RelicCommand } from "../ble/protocol";
import type { DeviceType } from "../ble/protocol";

// ---------------------------------------------------------------------------
// Action button — rendered in place of action: links in adventure markdown
// ---------------------------------------------------------------------------

function parseAction(href: string): RelicCommand | null {
  if (!href.startsWith("action:")) return null;
  const rest = href.slice(7);
  const qIdx = rest.indexOf("?");
  const op = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
  const query = qIdx >= 0 ? rest.slice(qIdx + 1) : "";
  const params: Record<string, string | number | boolean> = {};
  if (query) {
    for (const [k, v] of new URLSearchParams(query)) {
      if (v === "true") params[k] = true;
      else if (v === "false") params[k] = false;
      else if (!isNaN(Number(v)) && v !== "") params[k] = Number(v);
      else params[k] = v;
    }
  }
  return { op, ...params } as unknown as RelicCommand;
}

function deviceTypeForOp(op: string): DeviceType | null {
  if (op.startsWith("compass.")) return "compass";
  if (op.startsWith("lantern.")) return "lantern";
  if (op.startsWith("stones.")) return "fairy-stones";
  return null;
}

function ActionButton({ href, children }: { href: string; children: ReactNode }) {
  const { devices } = useBle();
  const [flash, setFlash] = useState(false);

  const cmd = useMemo(() => parseAction(href), [href]);
  const targetType = cmd ? deviceTypeForOp(cmd.op) : null;

  // Find the right device for this command's type, fall back to any device.
  const target = targetType
    ? (devices.find(d => d.info.type === targetType) ?? null)
    : (devices[0] ?? null);

  const canFire = !!target && !!cmd;

  async function handleClick() {
    if (!canFire) return;
    try {
      await target.send(cmd!);
      setFlash(true);
      setTimeout(() => setFlash(false), 1200);
    } catch {}
  }

  return (
    <button
      onClick={handleClick}
      title={canFire ? undefined : `Connect a ${targetType ?? "relic"} to use this`}
      className={[
        "not-prose inline-flex items-center gap-1.5 align-baseline",
        "text-[11px] px-2 py-0.5 rounded-full border transition-all duration-200",
        "font-sans font-medium tracking-wide",
        flash
          ? "bg-relic-glow/25 border-relic-glow/60 text-relic-parchment scale-95"
          : canFire
          ? "bg-relic-ink border-relic-rune/50 text-relic-rune hover:border-relic-rune/80 hover:text-relic-parchment cursor-pointer"
          : "bg-transparent border-white/10 text-relic-parchment/25 cursor-not-allowed",
      ].join(" ")}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0 opacity-70">
        <polygon points="1,1 7,4 1,7" fill="currentColor"/>
      </svg>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Adventure page
// ---------------------------------------------------------------------------

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
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          urlTransform={(url) => {
            if (url.startsWith("action:")) return url;
            // Default safe-URL passthrough (mirrors react-markdown internals)
            const colon = url.indexOf(":");
            return colon < 0 || /^(https?|ircs?|mailto|xmpp):/i.test(url) ? url : "";
          }}
          components={{
            a({ href, children }) {
              if (href?.startsWith("action:")) {
                return <ActionButton href={href}>{children}</ActionButton>;
              }
              return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
            },
          }}
        >
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
    case "compass":      return "Magic Compass";
    case "lantern":      return "Haunted Lantern";
    case "fairy-stones": return "Fairy Stones";
    default:             return "Relic";
  }
}

function prettyKind(kind: string): string {
  switch (kind) {
    case "intro":      return "Relic introduction";
    case "uses-relic": return "Uses a relic";
    case "general":    return "General quest";
    default:           return kind;
  }
}

function relicRouteOf(relic: DeviceType): string {
  switch (relic) {
    case "compass":      return "/compass";
    case "lantern":      return "/lantern";
    case "fairy-stones": return "/fairy-stones";
    default:             return "/";
  }
}
