import { Link, NavLink } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { ConnectionBadge } from "./ConnectionBadge";
import { RelicsMenu } from "./RelicsMenu";
import { UpdateBanner } from "./UpdateBanner";
import { BUILD_SHA } from "../buildInfo";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

// Top-level nav items, in order. The Relics dropdown is rendered in
// the middle of this list as a special case (see the nav body below).
const leftItems: NavItem[] = [{ to: "/", label: "Home", end: true }];
const rightItems: NavItem[] = [
  { to: "/adventures", label: "Adventures" },
  { to: "/store", label: "Store" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-relic-ink/70 border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <RelicMark />
            <span className="font-display text-lg sm:text-xl tracking-wider text-relic-parchment group-hover:text-relic-rune transition-colors">
              Tabletop Relics
            </span>
          </Link>
          <ConnectionBadge />
        </div>

        <nav className="mx-auto max-w-5xl px-2 sm:px-4 pb-2 overflow-x-auto">
          <ul className="flex gap-1 sm:gap-2 text-sm">
            {leftItems.map((item) => (
              <li key={item.to} className="shrink-0">
                <NavLinkItem item={item} />
              </li>
            ))}
            <li className="shrink-0">
              <RelicsMenu />
            </li>
            {rightItems.map((item) => (
              <li key={item.to} className="shrink-0">
                <NavLinkItem item={item} />
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-relic-parchment/40 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Tabletop Relics — control your enchanted props.</span>
        <FooterBuildInfo />
      </footer>
      <UpdateBanner />
    </div>
  );
}

function NavLinkItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          "block px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
          isActive
            ? "bg-relic-glow/20 text-relic-parchment"
            : "text-relic-parchment/70 hover:text-relic-parchment hover:bg-white/5",
        ].join(" ")
      }
    >
      {item.label}
    </NavLink>
  );
}

interface GHPull {
  number: number;
  title: string;
  merge_commit_sha: string | null;
}

function FooterBuildInfo() {
  const [pr, setPr] = useState<GHPull | null>(null);

  useEffect(() => {
    if (BUILD_SHA === "dev") return;
    fetch(
      `https://api.github.com/repos/JasonSchneider/TabletopRelics/pulls?state=closed&sort=updated&direction=desc&per_page=50`
    )
      .then((r) => r.json())
      .then((data: GHPull[]) => {
        const match = data.find((p) => p.merge_commit_sha === BUILD_SHA);
        if (match) setPr(match);
      })
      .catch(() => {});
  }, []);

  if (BUILD_SHA === "dev") return null;

  return (
    <Link
      to="/changelog"
      className="flex items-center gap-1.5 hover:text-relic-parchment/70 transition-colors group"
    >
      {pr ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399] shrink-0" />
          <span>
            PR #{pr.number}
            <span className="hidden sm:inline">: {pr.title.length > 48 ? pr.title.slice(0, 48) + "…" : pr.title}</span>
          </span>
        </>
      ) : (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-relic-parchment/20 shrink-0" />
          <span className="font-mono">{BUILD_SHA.slice(0, 7)}</span>
        </>
      )}
      <span className="text-relic-parchment/20 group-hover:text-relic-parchment/40 transition-colors">→</span>
    </Link>
  );
}

function RelicMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="w-7 h-7 drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="13" fill="none" stroke="#a78bfa" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="3" fill="#d4af37" />
      <path
        d="M16 4 L18 14 L16 16 L14 14 Z"
        fill="#f4ecd8"
        opacity="0.85"
      />
    </svg>
  );
}
