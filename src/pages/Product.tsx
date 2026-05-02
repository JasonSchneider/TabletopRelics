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
    rune: "text-relic-rune",
    ember: "text-relic-ember",
    glow: "text-relic-glow",
  }[product.accent];

  const accentBorder = {
    rune: "border-relic-rune",
    ember: "border-relic-ember",
    glow: "border-relic-glow",
  }[product.accent];

  const accentRing = {
    rune: "ring-relic-rune",
    ember: "ring-relic-ember",
    glow: "ring-relic-glow",
  }[product.accent];

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Breadcrumb */}
      <nav className="text-xs text-relic-parchment/40 flex items-center gap-1.5">
        <Link to="/store" className="hover:text-relic-parchment transition-colors">
          Store
        </Link>
        <span>/</span>
        <span className="text-relic-parchment/70">{product.name}</span>
      </nav>

      {/* Hero */}
      <section className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-start">
        <div className="w-full sm:w-48 shrink-0 flex justify-center">
          <div className="w-36 h-36 sm:w-48 sm:h-48">
            <ProductGlyph relic={product.relic} />
          </div>
        </div>
        <div className="space-y-3 flex-1">
          <p className={`font-display text-xs tracking-widest uppercase ${accentText}`}>
            Tabletop Relics
          </p>
          <h1 className="text-3xl sm:text-4xl text-relic-parchment">
            {product.name}
          </h1>
          <p className="text-relic-parchment/70 text-base italic">
            {product.tagline}
          </p>
          <p className="text-sm text-relic-parchment/80 max-w-xl leading-relaxed">
            {product.description}
          </p>
          <ul className="text-xs text-relic-parchment/60 space-y-1 pt-1 list-disc pl-4 marker:text-relic-rune/50">
            {product.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div className="pt-1">
            <Link
              to={`/${product.relic}`}
              className={`text-xs ${accentText} hover:underline`}
            >
              See it in the app →
            </Link>
          </div>
        </div>
      </section>

      {/* Tier selector */}
      <section className="space-y-5">
        <div className={`border-t ${accentBorder} opacity-20`} />
        <h2 className="font-display text-xl text-relic-parchment">
          Choose your version
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {product.tiers.map((tier) => {
            const isSelected = tier.kind === selectedTier.kind;
            return (
              <button
                key={tier.kind}
                onClick={() => setSelectedTier(tier)}
                className={`card p-5 text-left flex flex-col gap-3 ring-1 transition-all focus:outline-none
                  ${isSelected
                    ? `ring-2 ${accentRing} bg-white/[0.04]`
                    : "ring-transparent hover:ring-white/10"
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`font-display text-sm uppercase tracking-wider ${isSelected ? accentText : "text-relic-parchment/60"}`}>
                      {tierKindLabel(tier.kind)}
                    </p>
                    <p className="text-relic-parchment text-base font-medium mt-0.5">
                      {tier.label}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {isPaidTier(tier) ? (
                      <>
                        <p className="font-display text-xl text-relic-parchment">
                          {tier.price}
                        </p>
                        <StatusBadge status={tier.status} />
                      </>
                    ) : (
                      <p className={`font-display text-xl ${accentText}`}>Free</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-relic-parchment/60 leading-relaxed">
                  {tier.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected tier detail */}
        <TierPanel tier={selectedTier} accentText={accentText} />
      </section>
    </div>
  );
}

// --------------------------------------------------------- Tier panel

interface TierPanelProps {
  tier: ProductTier;
  accentText: string;
}

function TierPanel({ tier, accentText }: TierPanelProps) {
  return (
    <div className="card p-6 sm:p-8 space-y-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className={`font-display text-sm uppercase tracking-widest ${accentText}`}>
            What's included
          </h3>
          <ul className="space-y-1.5">
            {tier.includes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-relic-parchment/80">
                <span className={`mt-0.5 shrink-0 ${accentText}`}>✦</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-end gap-3">
          {isPaidTier(tier) ? (
            <PaidCTA tier={tier} />
          ) : (
            <DiyCTA tier={tier} accentText={accentText} />
          )}
        </div>
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
      <>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl text-relic-parchment">{tier.price}</span>
          <span className="text-xs uppercase tracking-wider text-relic-parchment/40">USD</span>
        </div>
        <button className="btn-primary w-full" disabled>
          Add to cart (checkout coming soon)
        </button>
      </>
    );
  }

  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl text-relic-parchment">{tier.price}</span>
        <span className="text-xs uppercase tracking-wider text-relic-parchment/40">USD</span>
        <StatusBadge status={tier.status} />
      </div>
      {notified ? (
        <p className="text-sm text-emerald-300/80 text-center py-2">
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
    </>
  );
}

function DiyCTA({ tier, accentText }: { tier: DiyTier; accentText: string }) {
  return (
    <>
      <p className="text-sm text-relic-parchment/60 leading-relaxed">
        Everything you need to build your own is on GitHub — schematics,
        firmware, and a full parts list. No account required.
      </p>
      <a
        href={tier.partsListUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary w-full text-center text-sm"
      >
        View parts list
      </a>
      <a
        href={tier.firmwareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn-ghost w-full text-center text-sm ${accentText}`}
      >
        Browse firmware →
      </a>
    </>
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
