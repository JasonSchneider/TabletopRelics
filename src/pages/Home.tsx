import { PropCard } from "../components/PropCard";
import { useBle } from "../ble/useBle";

export function Home() {
  const { supported, status, info, error } = useBle();

  return (
    <div className="space-y-8">
      <section className="text-center space-y-3">
        <h1 className="text-3xl sm:text-5xl text-relic-parchment">
          Choose your relic
        </h1>
        <p className="text-relic-parchment/70 max-w-xl mx-auto text-sm sm:text-base">
          Connect your enchanted prop over Bluetooth, then bend it to your
          will. Each relic has its own quirks — pick one to begin.
        </p>
      </section>

      {!supported && (
        <div className="card p-4 text-sm text-amber-200/90 border-amber-500/30">
          <strong className="font-semibold">Web Bluetooth isn't available in this browser.</strong>{" "}
          Use Chrome or Edge on desktop, or Chrome on Android. iOS users will
          need the upcoming native app — Safari does not support Web Bluetooth.
        </div>
      )}

      {error && (
        <div className="card p-4 text-sm text-rose-200/90 border-rose-500/30">
          <strong className="font-semibold">Connection error:</strong> {error}
        </div>
      )}

      {status === "connected" && info && (
        <div className="card p-4 text-sm">
          <span className="text-relic-parchment/60">Connected to </span>
          <span className="text-relic-rune">{info.type}</span>
          <span className="text-relic-parchment/60"> · firmware {info.fw}</span>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <PropCard
          to="/compass"
          title="Magic Compass"
          tagline="A brass needle that points where you need to go — true north, the next clue, or whatever you whisper to it."
          accent="text-relic-rune"
          available
          glyph={
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="24" cy="24" r="20" />
              <path d="M24 8 L28 26 L24 30 L20 26 Z" fill="currentColor" />
              <circle cx="24" cy="24" r="2" fill="currentColor" />
            </svg>
          }
        />
        <PropCard
          to="/lantern"
          title="Haunted Lantern"
          tagline="A flickering ember that responds to footsteps, breath, and incantation. Comes with three flavors of dread."
          accent="text-relic-ember"
          available
          glyph={
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 12 H32 V14 H16 Z" />
              <path d="M14 14 L34 14 L32 38 L16 38 Z" />
              <path d="M24 18 C 21 22 21 26 24 30 C 27 26 27 22 24 18 Z" fill="currentColor" />
              <path d="M22 38 V42 M26 38 V42 M24 8 V12" />
            </svg>
          }
        />
        <PropCard
          to="/fairy-stones"
          title="Fairy Stones"
          tagline="A constellation of tiny glowing pebbles. Scatter them across the table — they'll find each other and dance."
          accent="text-relic-glow"
          available
          glyph={
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="14" cy="30" r="5" fill="currentColor" fillOpacity="0.6" />
              <circle cx="28" cy="16" r="4" fill="currentColor" fillOpacity="0.6" />
              <circle cx="36" cy="32" r="6" fill="currentColor" fillOpacity="0.6" />
              <path d="M14 30 L28 16 L36 32 Z" strokeOpacity="0.4" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
