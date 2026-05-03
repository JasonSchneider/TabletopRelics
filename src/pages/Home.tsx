import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useBle } from "../ble/useBle";
import { getAdventures } from "../adventures";
import { PRODUCTS, startingPrice } from "../store/products";
import { ProductGlyph } from "../components/ProductGlyph";
import { BatteryIcon } from "../components/BatteryIcon";
import type { DeviceType } from "../ble/protocol";
import type { Adventure } from "../adventures/types";

/**
 * Home page reorganized as a hub: three rails, one per major activity
 * (a bonded relic, the adventure library, and the workshop store).
 * Each rail is a "look here, do something" affordance with a link out
 * to its dedicated page for the full experience.
 */
export function Home() {
  return (
    <div className="space-y-10 sm:space-y-12">
      <Hero />
      <DevicesRail />
      <AdventuresRail />
      <WorkshopRail />
    </div>
  );
}

// ----------------------------------------------------------------- Hero
function Hero() {
  return (
    <section className="text-center space-y-3 pt-2">
      <h1 className="text-3xl sm:text-5xl text-relic-parchment">
        Welcome, traveler
      </h1>
      <p className="text-relic-parchment/70 max-w-xl mx-auto text-sm sm:text-base">
        Bond a relic, browse the library for a quest worth running, or visit
        the workshop. The compass is on the table; the lantern is lit.
      </p>
    </section>
  );
}

// -------------------------------------------------------- Devices rail
function DevicesRail() {
  const { supported, status, info, device, battery, state, connect, disconnect } = useBle();
  const charging = state?.charging ?? false;

  return (
    <Rail
      eyebrow="Your relics"
      title="Connected devices"
      to={null}
    >
      {!supported ? (
        <div className="card p-5 text-sm text-amber-200/90 border-amber-500/30">
          <p className="font-semibold">Web Bluetooth isn't available here.</p>
          <p className="text-amber-200/70 mt-1">
            Use Chrome or Edge on desktop, or Chrome on Android. iOS support is
            coming via the native app.
          </p>
        </div>
      ) : status === "connected" && device && info ? (
        <div className="card p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex items-center gap-3 flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            <div>
              <p className="font-display text-lg text-relic-parchment">
                {device.name}
              </p>
              <p className="text-xs text-relic-parchment/60">
                {prettyRelic(info.type)} · firmware {info.fw}
              </p>
              <span className="flex items-center gap-1.5 mt-1 text-xs text-relic-parchment/60">
                <BatteryIcon percent={battery} charging={charging} />
                <span>{battery !== null ? `${battery}%` : "–"}</span>
                {charging && <span className="text-amber-400 font-medium">· Charging</span>}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={routeFor(info.type)}
              className="btn-primary text-sm"
            >
              Open controls
            </Link>
            <button onClick={disconnect} className="btn-ghost text-sm">
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1">
            <p className="font-display text-lg text-relic-parchment">
              No relic bonded
            </p>
            <p className="text-sm text-relic-parchment/60 mt-1">
              Tap connect to pair a Compass, Lantern, or Fairy Stone leader.
              Your device will appear here once linked.
            </p>
          </div>
          <button
            onClick={connect}
            disabled={status === "connecting"}
            className="btn-primary"
          >
            {status === "connecting" ? "Connecting…" : "Connect a relic"}
          </button>
        </div>
      )}
    </Rail>
  );
}

// ------------------------------------------------------ Adventures rail
function AdventuresRail() {
  // Show the three most recently added adventures (by title for now since
  // we don't yet track creation timestamps; swap in real "newest" later).
  const featured: Adventure[] = getAdventures().slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <Rail
      eyebrow="The library"
      title="New adventures"
      to="/adventures"
      ctaLabel="Browse all adventures →"
    >
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((adv) => (
          <Link
            key={adv.id}
            to={`/adventures/${adv.id}`}
            className="card p-4 sm:p-5 block hover:-translate-y-0.5 transition-transform focus:outline-none focus:ring-2 focus:ring-relic-glow"
          >
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <h3 className="font-display text-base text-relic-parchment leading-tight">
                {adv.title}
              </h3>
              {adv.relic && (
                <span
                  className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${relicAccent(adv.relic)}`}
                >
                  {prettyRelicShort(adv.relic)}
                </span>
              )}
            </div>
            <p className="text-sm text-relic-parchment/70 line-clamp-3 mt-1">
              {adv.summary}
            </p>
            <p className="text-[11px] text-relic-parchment/50 mt-3">
              Level {adv.level} · {adv.duration}
            </p>
          </Link>
        ))}
      </div>
    </Rail>
  );
}

// -------------------------------------------------------- Workshop rail
function WorkshopRail() {
  return (
    <Rail
      eyebrow="The workshop"
      title="From the bench"
      to="/store"
      ctaLabel="Visit the store →"
    >
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((product) => (
          <Link
            key={product.id}
            to={`/store/${product.id}`}
            className="card p-4 sm:p-5 block hover:-translate-y-0.5 transition-transform focus:outline-none focus:ring-2 focus:ring-relic-glow"
          >
            <ProductGlyph relic={product.relic} />
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <h3 className="font-display text-base text-relic-parchment">
                {product.name}
              </h3>
              <span className="text-sm text-relic-parchment/80">
                {startingPrice(product)}
              </span>
            </div>
            <p className="text-xs text-relic-parchment/60 italic mt-1">
              {product.tagline}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-relic-parchment/40 mt-2">
              Kit & DIY also available
            </p>
          </Link>
        ))}
      </div>
    </Rail>
  );
}

// ------------------------------------------------------- Shared layout
interface RailProps {
  eyebrow: string;
  title: string;
  /** Destination of the section header link. Pass `null` to omit the CTA. */
  to: string | null;
  ctaLabel?: string;
  children: ReactNode;
}
function Rail({ eyebrow, title, to, ctaLabel, children }: RailProps) {
  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-relic-rune font-display text-xs sm:text-sm tracking-widest uppercase">
            {eyebrow}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-relic-parchment">
            {title}
          </h2>
        </div>
        {to && ctaLabel && (
          <Link
            to={to}
            className="text-sm text-relic-parchment/70 hover:text-relic-parchment"
          >
            {ctaLabel}
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

// ------------------------------------------------------------ Helpers
function prettyRelic(type: DeviceType): string {
  switch (type) {
    case "compass":
      return "Magic Compass";
    case "lantern":
      return "Haunted Lantern";
    case "fairy-stones":
      return "Fairy Stones";
    default:
      return "Unknown relic";
  }
}

function prettyRelicShort(type: DeviceType): string {
  switch (type) {
    case "compass":
      return "Compass";
    case "lantern":
      return "Lantern";
    case "fairy-stones":
      return "Stones";
    default:
      return "Relic";
  }
}

function routeFor(type: DeviceType): string {
  switch (type) {
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

function relicAccent(relic: DeviceType): string {
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
