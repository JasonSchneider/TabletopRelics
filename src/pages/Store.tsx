import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PRODUCTS, type Product } from "../store/products";
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
          Hand-finished props built to play with. Each relic ships with the
          Tabletop Relics app, USB-C charging, and a year of firmware updates.
          Pre-orders ship in batches; reserve your spot below.
        </p>
      </header>

      <p className="text-xs text-relic-parchment/40 italic">
        Pricing and availability are placeholder while the workshop is being
        set up. Subscribers below will be notified when each relic opens for
        order.
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
  const [notified, setNotified] = useState(false);
  const [email, setEmail] = useState("");

  function handleNotify(e: FormEvent) {
    e.preventDefault();
    // TODO: wire up to real backend (Resend, Buttondown, custom function).
    // For now we just acknowledge and keep the form local.
    if (email.trim()) {
      setNotified(true);
    }
  }

  const accentRing = {
    rune: "hover:ring-relic-rune/40",
    ember: "hover:ring-relic-ember/40",
    glow: "hover:ring-relic-glow/40",
  }[product.accent];

  const ctaClass =
    product.status === "available" ? "btn-primary" : "btn-ghost";

  return (
    <article
      className={`card p-5 sm:p-6 flex flex-col gap-4 ring-1 ring-transparent transition ${accentRing}`}
    >
      <ProductGlyph relic={product.relic} />

      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-xl text-relic-parchment">
            {product.name}
          </h3>
          <StatusBadge status={product.status} />
        </div>
        <p className="text-sm text-relic-parchment/70 italic">
          {product.tagline}
        </p>
      </div>

      <p className="text-sm text-relic-parchment/80">{product.description}</p>

      <ul className="text-xs text-relic-parchment/60 space-y-1 list-disc pl-4 marker:text-relic-rune/60">
        {product.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between pt-2 border-t border-white/5">
        <span className="text-2xl font-display text-relic-parchment">
          {product.price}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-relic-parchment/40">
          USD
        </span>
      </div>

      {product.status === "available" ? (
        <button className={ctaClass} disabled>
          Add to cart (checkout coming soon)
        </button>
      ) : notified ? (
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
            {product.status === "preorder" ? "Reserve a pre-order" : "Notify me"}
          </button>
        </form>
      )}

      <Link
        to={`/${product.relic === "fairy-stones" ? "fairy-stones" : product.relic}`}
        className="text-xs text-relic-parchment/50 hover:text-relic-parchment text-center"
      >
        See it in the app →
      </Link>
    </article>
  );
}

function StatusBadge({ status }: { status: Product["status"] }) {
  const styles = {
    available: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    preorder: "bg-relic-glow/15 text-relic-glow border-relic-glow/30",
    soon: "bg-white/5 text-relic-parchment/60 border-white/10",
  }[status];
  const label = {
    available: "In stock",
    preorder: "Pre-order",
    soon: "Coming soon",
  }[status];
  return (
    <span
      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${styles}`}
    >
      {label}
    </span>
  );
}
