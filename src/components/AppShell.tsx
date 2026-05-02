import { Link, NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { ConnectionBadge } from "./ConnectionBadge";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/compass", label: "Compass" },
  { to: "/lantern", label: "Lantern" },
  { to: "/fairy-stones", label: "Fairy Stones" },
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
            {navItems.map((item) => (
              <li key={item.to} className="shrink-0">
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
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-relic-parchment/40 text-center">
        Tabletop Relics — control your enchanted props.
      </footer>
    </div>
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
