/**
 * The order encoded in a link, so a shared order opens in the app.
 * Each line is one `e` parameter: `<code>.<count>.<name>`, e.g. `?e=km.2.Ola&e=s2k.1`.
 */
import { MAX_PER_LINE, normalizeName, parseLines, type EggSpec, type OrderLine } from "./order";

const PARAM = "e";
const MAX_LINES = 50;
const MAX_NAME = 30;

const CODES: Record<string, EggSpec> = {
  kb: { kind: "kokt", doneness: "bløtkokt" },
  km: { kind: "kokt", doneness: "medium" },
  kh: { kind: "kokt", doneness: "hardkokt" },
  s1h: { kind: "stekt", sides: "en", yolk: "hel" },
  s1k: { kind: "stekt", sides: "en", yolk: "knust" },
  s2h: { kind: "stekt", sides: "begge", yolk: "hel" },
  s2k: { kind: "stekt", sides: "begge", yolk: "knust" },
};

function codeFor(spec: EggSpec): string {
  if (spec.kind === "kokt") return `k${spec.doneness === "bløtkokt" ? "b" : spec.doneness[0]}`;
  return `s${spec.sides === "en" ? 1 : 2}${spec.yolk[0]}`;
}

/** A link to `base` that opens with this order loaded. */
export function shareUrl(lines: OrderLine[], base: string): string {
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  for (const l of lines) {
    const parts = [codeFor(l.spec), String(l.count)];
    if (l.who) parts.push(l.who);
    url.searchParams.append(PARAM, parts.join("."));
  }
  return url.toString();
}

/** Reads an order from a link's query string. Unknown or malformed lines are skipped. */
export function linesFromSearch(search: string, makeId: () => string): OrderLine[] {
  const lines: OrderLine[] = [];
  for (const raw of new URLSearchParams(search).getAll(PARAM).slice(0, MAX_LINES)) {
    const [code, countText, ...rest] = raw.split(".");
    const spec = CODES[code];
    const count = Number(countText);
    if (!spec || !Number.isInteger(count) || count < 1) continue;
    lines.push({
      id: makeId(),
      spec,
      count: Math.min(MAX_PER_LINE, count),
      who: normalizeName(rest.join(".")).slice(0, MAX_NAME),
    });
  }
  return parseLines(lines);
}

export const hasSharedOrder = (search: string) => new URLSearchParams(search).has(PARAM);

/** Adds new names after the saved ones. Never removes or reorders saved names. */
export function mergeNames(saved: string[], incoming: string[]): string[] {
  const seen = new Set(saved.map((n) => n.toLocaleLowerCase("nb")));
  const added: string[] = [];
  for (const name of incoming) {
    const key = name.toLocaleLowerCase("nb");
    if (name && !seen.has(key)) {
      seen.add(key);
      added.push(name);
    }
  }
  return [...saved, ...added];
}
