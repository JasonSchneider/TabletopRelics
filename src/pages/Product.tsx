import { useState, type FormEvent } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { getProductById, isPaidTier } from "../store/products";
import type { Product, ProductTier, PaidTier, DiyTier } from "../store/products";
import { ProductGlyph } from "../components/ProductGlyph";

export function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const product = productId ? getProductById(productId) : undefined;

  if (!product) return <Navigate to="/store" replace />;

  return <ProductDetail product={product} />;
}

function ProductDetail({ product }: { product: Product }) {
  const [selectedTier, setSelectedTier] = useState<ProductTier>(product.tiers[0]);

  const accentText = {
    rune:  "text-relic-rune",
    ember: "text-relic-ember",
    glow:  "text-relic-glow",
  }[product.accent];

  const accentBorder = {
    rune:  "border-relic-rune",
    ember: "border-relic-ember",
    glow:  "border-relic-glow",
  }[product.accent];

  const accentBg = {
    rune:  "bg-relic-rune",
    ember: "bg-relic-ember",
    glow:  "bg-relic-glow",
  }[product.accent];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-relic-parchment/40 flex items-center gap-1.5">
        <Link to="/store" className="hover:text-relic-parchment transition-colors">
          Store
        </Link>
        <span>/</span>
        <span className="text-relic-parchment/70">{product.name}</span>
      </nav>

      {/*
        Two-column on desktop: product identity left, tier selector right.
        Single column on mobile with a compact inline hero.
      */}
      <div className="sm:grid sm:grid-cols-[2fr_3fr] sm:gap-10 sm:items-start">

        {/* ── Left col: product identity ── */}
        <div className="space-y-4">
          {/* Mobile: small inline header (glyph + name side by side) */}
          <div className="flex items-center gap-4 sm:block">
            <div className="w-14 h-14 shrink-0 sm:hidden">
              <ProductGlyph relic={product.relic} />
            </div>
            <div>
              <p className={`font-display text-[10px] tracking-widest uppercase ${accentText}`}>
                Tabletop Relics
              </p>
              <h1 className="text-2xl sm:text-3xl text-relic-parchment leading-tight">
                {product.name}
              </h1>
              <p className="text-sm text-relic-parchment/60 italic mt-0.5">
                {product.tagline}
              </p>
            </div>
          </div>

          {/* Desktop-only large glyph */}
          <div className="hidden sm:block w-full aspect-square max-w-[180px]">
            <ProductGlyph relic={product.relic} />
          </div>

          <p className="text-sm text-relic-parchment/75 leading-relaxed">
            {product.description}
          </p>

          <ul className="text-xs text-relic-parchment/55 space-y-1 list-disc pl-4 marker:text-relic-rune/40">
            {product.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>

          <Link
            to={`/${product.relic}`}
            className={`inline-block text-xs ${accentText} hover:underline`}
          >
            See it in the app →
          </Link>
        </div>

        {/* ── Right col: tier selector ── */}
        <div className="space-y-3 mt-5 sm:mt-0">
          <div className={`border-t ${accentBorder} opacity-20 sm:hidden`} />

          <h2 className="font-display text-base sm:text-lg text-relic-parchment">
            Choose your version
          </h2>

          {/* Tab strip */}
          <div className="card divide-y divide-white/5 overflow-hidden">
            {product.tiers.map((tier) => {
              const isSelected = tier.kind === selectedTier.kind;
              return (
                <button
                  key={tier.kind}
                  onClick={() => setSelectedTier(tier)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors focus:outline-none
                    ${isSelected ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`shrink-0 w-0.5 h-4 rounded-full transition-colors ${isSelected ? accentBg : "bg-white/10"}`} />
                    <div className="min-w-0">
                      <span className={`font-display text-[10px] uppercase tracking-widest ${isSelected ? accentText : "text-relic-parchment/40"}`}>
                        {tierKindLabel(tier.kind)}
                      </span>
                      <p className={`text-sm font-medium truncate leading-tight ${isSelected ? "text-relic-parchment" : "text-relic-parchment/65"}`}>
                        {tier.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPaidTier(tier) ? (
                      <>
                        <StatusBadge status={tier.status} />
                        <span className={`font-display text-base ${isSelected ? "text-relic-parchment" : "text-relic-parchment/55"}`}>
                          {tier.price}
                        </span>
                      </>
                    ) : (
                      <span className={`font-display text-base ${isSelected ? accentText : "text-relic-parchment/55"}`}>
                        Free
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <TierPanel tier={selectedTier} accentText={accentText} />
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------- Tier panel

function TierPanel({ tier, accentText }: { tier: ProductTier; accentText: string }) {
  return (
    <div className="card p-4 sm:p-5 space-y-4">
      <div>
        <h3 className={`font-display text-xs uppercase tracking-widest mb-2 ${accentText}`}>
          What's included
        </h3>
        <ul className="space-y-1">
          {tier.includes.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-relic-parchment/75">
              <span className={`mt-px shrink-0 ${accentText}`}>✦</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className={`border-t border-white/5 pt-4`}>
        {isPaidTier(tier) ? (
          <PaidCTA tier={tier} />
        ) : (
          <DiyCTA tier={tier} accentText={accentText} />
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------- CTAs

function PaidCTA({ tier }: { tier: PaidTier }) {
  const [notified, setNotified] = useState(false);
  const [email, setEmail] = useState("");

  function handleNotify(e: FormEvent) {
    e.preventDefault();
    if (email.trim()) setNotified(true);
  }

  if (tier.status === "available") {
    return (
      <div className="space-y-2">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl text-relic-parchment">{tier.price}</span>
          <span className="text-[10px] uppercase tracking-wider text-relic-parchment/40">USD</span>
        </div>
        <button className="btn-primary w-full text-sm" disabled>
          Add to cart (checkout coming soon)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-display text-2xl text-relic-parchment">{tier.price}</span>
        <span className="text-[10px] uppercase tracking-wider text-relic-parchment/40">USD</span>
        <StatusBadge status={tier.status} />
      </div>
      {notified ? (
        <p className="text-sm text-emerald-300/80 py-1">
          Got it — we'll email you when this opens.
        </p>
      ) : (
        <form onSubmit={handleNotify} className="space-y-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-relic-parchment placeholder:text-relic-parchment/30 focus:outline-none focus:border-relic-glow/60"
          />
          <button type="submit" className="btn-primary w-full text-sm">
            {tier.status === "preorder" ? "Reserve a pre-order" : "Notify me"}
          </button>
        </form>
      )}
    </div>
  );
}

function DiyCTA({ tier, accentText }: { tier: DiyTier; accentText: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-relic-parchment/55 leading-relaxed">
        Full schematics, firmware, and parts list on GitHub. No cost, no waitlist.
      </p>
      <a
        href={tier.partsListUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary w-full text-center text-sm block"
      >
        View parts list
      </a>
      <a
        href={tier.firmwareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn-ghost w-full text-center text-sm block ${accentText}`}
      >
        Browse firmware →
      </a>
    </div>
  );
}

// --------------------------------------------------------- Helpers

function tierKindLabel(kind: ProductTier["kind"]): string {
  switch (kind) {
    case "finished": return "Finished";
    case "kit":      return "Kit";
    case "diy":      return "DIY";
  }
}

function StatusBadge({ status }: { status: PaidTier["status"] }) {
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
