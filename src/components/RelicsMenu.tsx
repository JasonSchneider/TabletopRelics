import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

/**
 * Single dropdown that replaces the three per-relic nav links. Click
 * "Relics" to expand a small panel that links to each relic's page.
 *
 * Behavior:
 *   - Click the trigger to toggle.
 *   - Click anywhere outside the menu to dismiss.
 *   - Escape dismisses and returns focus to the trigger.
 *   - Selecting an item navigates and dismisses.
 *
 * The trigger keeps the same visual treatment as a regular nav item
 * (active when the current route matches one of the relic pages).
 */

interface RelicLink {
  to: string;
  label: string;
  /** Tailwind text-color utility for the small accent bullet. */
  accent: string;
  blurb: string;
}

const RELICS: RelicLink[] = [
  {
    to: "/compass",
    label: "Magic Compass",
    accent: "text-relic-rune",
    blurb: "A needle that points where the story needs.",
  },
  {
    to: "/lantern",
    label: "Haunted Lantern",
    accent: "text-relic-ember",
    blurb: "A flame that responds to footsteps and breath.",
  },
  {
    to: "/fairy-stones",
    label: "Fairy Stones",
    accent: "text-relic-glow",
    blurb: "A constellation of pebbles that talk to each other.",
  },
];

export function RelicsMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();

  const isActive = RELICS.some((r) => location.pathname.startsWith(r.to));

  // Dismiss on outside click and on Escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Close the menu on route change so navigating from a menu item
  // doesn't leave the panel hanging open.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
          isActive
            ? "bg-relic-glow/20 text-relic-parchment"
            : "text-relic-parchment/70 hover:text-relic-parchment hover:bg-white/5",
        ].join(" ")}
      >
        Relics
        <svg
          viewBox="0 0 12 12"
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            d="M2 4 L6 8 L10 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 z-30 w-64 sm:w-72
            rounded-xl border border-white/10 bg-relic-shadow/95
            backdrop-blur-md shadow-2xl overflow-hidden"
        >
          <ul className="py-1">
            {RELICS.map((relic) => (
              <li key={relic.to}>
                <Link
                  to={relic.to}
                  role="menuitem"
                  className="flex items-start gap-3 px-3 py-2.5 hover:bg-white/5
                    focus:bg-white/5 focus:outline-none transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <span
                    className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 ${relic.accent}`}
                    aria-hidden="true"
                  />
                  <span className="flex-1">
                    <span className="block font-display text-sm text-relic-parchment">
                      {relic.label}
                    </span>
                    <span className="block text-[11px] text-relic-parchment/60 mt-0.5">
                      {relic.blurb}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
