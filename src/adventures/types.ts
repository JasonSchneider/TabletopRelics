/**
 * Data model for prewritten adventure modules.
 *
 * Adventures live as standalone Markdown files in
 * src/adventures/modules/, with YAML-ish frontmatter for metadata and
 * the adventure prose in the body. The `index.ts` loader discovers
 * every .md file at build time and parses it into one of these.
 */

import type { DeviceType } from "../ble/protocol";

/**
 * What kind of relationship the adventure has to a relic.
 *
 *   - `intro`      — the adventure introduces the relic to the players
 *                    (the relic is found / awakened during the story).
 *   - `uses-relic` — the relic is a tool used during the adventure
 *                    but not its central focus.
 *   - `general`    — no relic; a self-contained quest a DM can drop
 *                    into any campaign.
 */
export type AdventureKind = "intro" | "uses-relic" | "general";

/** Metadata authored in the markdown frontmatter. */
export interface AdventureMeta {
  /** Slug used in the URL — derived from filename if not provided. */
  id: string;
  title: string;
  /** Which relic, if any, this adventure features. */
  relic: DeviceType | null;
  kind: AdventureKind;
  /** Recommended character level range, e.g. "1-3". */
  level: string;
  /** Recommended party size, e.g. "3-5". */
  partySize: string;
  /** Approximate play time, e.g. "1 session" or "2-3 hours". */
  duration: string;
  /** Free-form tags for filtering (e.g. "dungeon", "mystery"). */
  tags: string[];
  /** One-sentence pitch shown on the index card. */
  summary: string;
}

/** Full adventure: metadata + raw markdown body. */
export interface Adventure extends AdventureMeta {
  /** Markdown body — everything after the closing `---` of the frontmatter. */
  content: string;
}
