/**
 * Discovers every adventure module at build time and exposes a typed
 * array. To add a new adventure, drop a `.md` file in `./modules/` —
 * Vite's `import.meta.glob` picks it up the next time the bundler runs.
 */

import { parseFrontmatter } from "./frontmatter";
import type { Adventure, AdventureKind, AdventureMeta } from "./types";
import type { DeviceType } from "../ble/protocol";

// `eager: true` inlines the file contents at build time; `query: '?raw'`
// gives us the file as a string instead of letting Vite try to parse it.
const rawModules = import.meta.glob("./modules/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const VALID_KINDS: AdventureKind[] = ["intro", "uses-relic", "general"];
const VALID_RELICS: DeviceType[] = [
  "compass",
  "lantern",
  "fairy-stones",
  "unknown",
];

function slugFromPath(path: string): string {
  // ./modules/the-shrouded-cairn.md -> the-shrouded-cairn
  const base = path.split("/").pop() ?? path;
  return base.replace(/\.md$/, "");
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

function asKind(value: unknown): AdventureKind {
  return typeof value === "string" && (VALID_KINDS as string[]).includes(value)
    ? (value as AdventureKind)
    : "general";
}

function asRelic(value: unknown): DeviceType | null {
  if (value === null) return null;
  if (typeof value === "string" && (VALID_RELICS as string[]).includes(value)) {
    return value as DeviceType;
  }
  return null;
}

function buildAdventure(path: string, raw: string): Adventure {
  const { data, body } = parseFrontmatter(raw);
  const meta: AdventureMeta = {
    id: asString(data.id) || slugFromPath(path),
    title: asString(data.title, "Untitled Adventure"),
    relic: asRelic(data.relic),
    kind: asKind(data.kind),
    level: asString(data.level, "any"),
    partySize: asString(data.partySize, "any"),
    duration: asString(data.duration, "1 session"),
    tags: asStringArray(data.tags),
    summary: asString(data.summary, ""),
  };
  return { ...meta, content: body.trim() };
}

const ALL_ADVENTURES: Adventure[] = Object.entries(rawModules)
  .map(([path, raw]) => buildAdventure(path, raw))
  // Sort by title for stable ordering on the index page.
  .sort((a, b) => a.title.localeCompare(b.title));

export function getAdventures(): Adventure[] {
  return ALL_ADVENTURES;
}

export function getAdventureById(id: string): Adventure | undefined {
  return ALL_ADVENTURES.find((a) => a.id === id);
}

export function getAdventuresForRelic(relic: DeviceType): Adventure[] {
  return ALL_ADVENTURES.filter((a) => a.relic === relic);
}

export type { Adventure, AdventureKind, AdventureMeta } from "./types";
