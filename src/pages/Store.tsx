import { Link } from "react-router-dom";
import { PRODUCTS, startingPrice, isPaidTier } from "../store/products";
import type { Product } from "../store/products";
import { ProductGlyph } from "../components/ProductGlyph";

export function Store() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-relic-rune font-display text-sm tracking-widest uppercase">
          The Workshop
        </p>
        <h1 className="text-3xl sm:text-4xl">Store</h1>
        <p className="text-relic-parchment/70 text-sm sm:text-base max-w-2xl">
          Hand-finished props built to play with. Each relic is available
          ready-to-play, as a build-it-yourself kit, or as free open plans.
          Pre-orders ship in batches; reserve your spot below.
        </p>
      </header>

      <p className="text-xs text-relic-parchment/40 italic">
        Pricing and availability are placeholder while the workshop is being
        set up. Subscribers will be notified when each relic opens for order.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="card p-6 sm:p-8 mt-8">
        <h2 className="font-display text-xl text-relic-parchment mb-2">
          Stocking your table
        </h2>
        <p className="text-sm text-relic-parchment/70 max-w-2xl">
          Building a campaign around the relics? Multi-relic bundles and
          DM-pack pricing are in the works. If you're running a public game
          night, a convention, or a podcast and want to feature the props,
          drop a note via the workshop signup and we'll be in touch.
        </p>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const accentRing = {
    rune:  "hover:ring-relic-rune/40",
    ember: "hover:ring-relic-ember/40",
    glow:  "hover:ring-relic-glow/40",
  }[product.accent];

  const accentText = {
    rune:  "text-relic-rune",
    ember: "text-relic-ember",
    glow:  "text-relic-glow",
  }[product.accent];

  // Build compact tier summary: "Finished $149 · Kit $89 · Plans Free"
  const tierSummary = product.tiers
    .map((t) =>
      isPaidTier(t)
        ? `${t.kind === "finished" ? "Finished" : "Kit"} ${t.price}`
        : "Plans Free"
    )
    .join(" · ");

  // Representative status from the finished tier
  const finishedTier = product.tiers[0];
  const status = finishedTier.status;

  return (
    <Link
      to={`/store/${product.id}`}
      className={`card p-5 sm:p-6 flex flex-col gap-4 ring-1 ring-transparent transition ${accentRing} focus:outline-none focus:ring-2 focus:ring-relic-glow`}
    >
      <ProductGlyph relic={product.relic} />

      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-xl text-relic-parchment">
            {product.name}
          </h3>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-relic-parchment/70 italic">
          {product.tagline}
        </p>
      </div>

      <p className="text-sm text-relic-parchment/80 flex-1">
        {product.description}
      </p>

      <div className="border-t border-white/5 pt-3 space-y-2">
        <p className="text-xs text-relic-parchment/50">{tierSummary}</p>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-display text-relic-parchment">
            {startingPrice(product)}
          </span>
          <span className={`text-xs ${accentText}`}>
            View versions →
          </span>
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: "available" | "preorder" | "soon" }) {
  const styles = {
    available: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    preorder:  "bg-relic-glow/15 text-relic-glow border-relic-glow/30",
    soon:      "bg-white/5 text-relic-parchment/60 border-white/10",
  }[status];
  const label = {
    available: "In stock",
    preorder:  "Pre-order",
    soon:      "Coming soon",
  }[status];
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${styles}`}>
      {label}
    </span>
  );
}
