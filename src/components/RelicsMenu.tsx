import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";

/**
 * Relics dropdown nav item. The trigger lives inside the AppShell's
 * `<nav>` (which uses overflow-x-auto on mobile), so the dropdown
 * panel itself is rendered through a portal to document.body and
 * positioned with viewport-fixed coordinates. That keeps it from
 * being clipped by the nav's overflow box and ensures it draws on
 * top of every other UI element.
 *
 * Behavior:
 *   - Click the trigger to toggle.
 *   - Click anywhere outside the menu (or trigger) to dismiss.
 *   - Escape dismisses and returns focus to the trigger.
 *   - Selecting an item navigates and dismisses.
 *   - Scroll or resize while open recomputes the panel's position so
 *     it stays anchored to the trigger.
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

interface PanelPosition {
  top: number;
  left: number;
}

export function RelicsMenu() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PanelPosition>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  const isActive = RELICS.some((r) => location.pathname.startsWith(r.to));

  // Measure trigger and place the panel just below it, in viewport coords.
  // useLayoutEffect avoids a one-frame flash where the panel is at (0,0).
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const measure = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open]);

  // Dismiss on outside click and on Escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      const insideTrigger = triggerRef.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideTrigger && !insidePanel) {
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

  // Close on route change so the menu doesn't linger after navigation.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
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

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            // z-50 puts it above the sticky header (z-20) and any other
            // page content. position: fixed lets it ignore the nav's
            // overflow clipping entirely.
            className="fixed z-50 w-64 sm:w-72
              rounded-xl border border-white/10 bg-relic-shadow/95
              backdrop-blur-md shadow-2xl overflow-hidden"
            style={{ top: position.top, left: position.left }}
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
          </div>,
          document.body,
        )}
    </>
  );
}
