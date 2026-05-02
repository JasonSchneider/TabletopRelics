/**
 * Tiny YAML-flavored frontmatter parser tailored for adventure modules.
 *
 * Why not gray-matter? gray-matter is a Node-targeted library that pulls
 * in a Buffer polyfill. Our frontmatter shape is stable and small, so a
 * 60-line parser is simpler than wiring in a polyfill.
 *
 * Supported value types:
 *   - strings (with or without quotes)
 *   - null  (literal `null` or `~`)
 *   - inline arrays:  `tags: [dungeon, mystery]`
 *
 * Out of scope: nested objects, multiline strings, anchors. If we ever
 * need them, swap this for `yaml` from npm.
 */

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export interface ParsedFrontmatter {
  data: Record<string, unknown>;
  body: string;
}

export function parseFrontmatter(source: string): ParsedFrontmatter {
  const match = source.match(FRONTMATTER_RE);
  if (!match) {
    return { data: {}, body: source };
  }

  const [, rawFrontmatter, body] = match;
  const data: Record<string, unknown> = {};

  for (const rawLine of rawFrontmatter.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const colonAt = line.indexOf(":");
    if (colonAt === -1) continue;

    const key = line.slice(0, colonAt).trim();
    const rawValue = line.slice(colonAt + 1).trim();
    data[key] = parseValue(rawValue);
  }

  return { data, body };
}

function parseValue(raw: string): unknown {
  if (raw === "" || raw === "null" || raw === "~") return null;

  // Inline array: [a, b, "c d"]
  if (raw.startsWith("[") && raw.endsWith("]")) {
    const inner = raw.slice(1, -1).trim();
    if (!inner) return [];
    return splitTopLevelCommas(inner).map((s) => parseValue(s.trim()));
  }

  // Quoted strings.
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }

  // Numbers (rare in our data, but handle them).
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);

  // Booleans.
  if (raw === "true") return true;
  if (raw === "false") return false;

  return raw;
}

/** Split on commas that are not inside quotes. */
function splitTopLevelCommas(input: string): string[] {
  const out: string[] = [];
  let buf = "";
  let quote: '"' | "'" | null = null;

  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null;
      buf += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
    } else if (ch === ",") {
      out.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) out.push(buf);
  return out;
}
