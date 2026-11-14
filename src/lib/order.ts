/** Domain model and pure helpers for an egg order. No React, no storage. */

export type Doneness = "bløtkokt" | "medium" | "hardkokt";
export type Sides = "en" | "begge";
export type Yolk = "hel" | "knust";

export type EggSpec =
  | { kind: "kokt"; doneness: Doneness }
  | { kind: "stekt"; sides: Sides; yolk: Yolk };

export type EggKind = EggSpec["kind"];

export type OrderLine = {
  id: string;
  spec: EggSpec;
  count: number;
  /** Who the eggs are for. Empty string when not given. */
  who: string;
};

export const MAX_PER_LINE = 12;

export const DONENESS: { value: Doneness; label: string; hint: string; minutes: number }[] = [
  { value: "bløtkokt", label: "Bløtkokt", hint: "Rennende plomme", minutes: 6 },
  { value: "medium", label: "Medium", hint: "Myk, seig plomme", minutes: 8 },
  { value: "hardkokt", label: "Hardkokt", hint: "Fast hele veien", minutes: 10 },
];

export const SIDES: { value: Sides; label: string; hint: string }[] = [
  { value: "en", label: "Én side", hint: "Speilegg, plomma opp" },
  { value: "begge", label: "Begge sider", hint: "Snudd i panna" },
];

export const YOLK: { value: Yolk; label: string; hint: string }[] = [
  { value: "hel", label: "Hel plomme", hint: "Som den er" },
  { value: "knust", label: "Knust plomme", hint: "Prikket hull på" },
];

export const minutesFor = (d: Doneness) => DONENESS.find((o) => o.value === d)!.minutes;

/** A stable key: two lines with the same key are the same kind of egg. */
export function specKey(spec: EggSpec): string {
  return spec.kind === "kokt" ? `kokt:${spec.doneness}` : `stekt:${spec.sides}:${spec.yolk}`;
}

export function specLabel(spec: EggSpec): string {
  if (spec.kind === "kokt") return DONENESS.find((o) => o.value === spec.doneness)!.label;
  const sides = spec.sides === "en" ? "Én side" : "Begge sider";
  return spec.yolk === "knust" ? `${sides}, knust plomme` : sides;
}

export const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ");

const sameName = (a: string, b: string) =>
  a.localeCompare(b, "nb", { sensitivity: "accent" }) === 0;

/** Adds eggs, merging into an existing line for the same egg and person. */
export function addLine(
  lines: OrderLine[],
  spec: EggSpec,
  count: number,
  who: string,
  makeId: () => string,
): OrderLine[] {
  const name = normalizeName(who);
  const key = specKey(spec);
  const match = lines.find((l) => specKey(l.spec) === key && sameName(l.who, name));
  if (match) {
    return lines.map((l) =>
      l === match ? { ...l, count: Math.min(MAX_PER_LINE, l.count + count) } : l,
    );
  }
  return [...lines, { id: makeId(), spec, count: Math.min(MAX_PER_LINE, count), who: name }];
}

/** Changes a line's count. Dropping to zero removes the line. */
export function changeCount(lines: OrderLine[], id: string, delta: number): OrderLine[] {
  return lines.flatMap((l) => {
    if (l.id !== id) return [l];
    const count = Math.min(MAX_PER_LINE, l.count + delta);
    return count > 0 ? [{ ...l, count }] : [];
  });
}

export const totalEggs = (lines: OrderLine[]) => lines.reduce((sum, l) => sum + l.count, 0);

export type SpecGroup = { key: string; spec: EggSpec; count: number; lines: OrderLine[] };

/** Groups lines by egg type, kokt before stekt, then in menu order. */
export function groupBySpec(lines: OrderLine[]): SpecGroup[] {
  const groups = new Map<string, SpecGroup>();
  for (const line of lines) {
    const key = specKey(line.spec);
    const group = groups.get(key) ?? { key, spec: line.spec, count: 0, lines: [] };
    group.count += line.count;
    group.lines.push(line);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => rank(a.spec) - rank(b.spec));
}

function rank(spec: EggSpec): number {
  if (spec.kind === "kokt") return DONENESS.findIndex((o) => o.value === spec.doneness);
  return 10 + (spec.sides === "begge" ? 2 : 0) + (spec.yolk === "knust" ? 1 : 0);
}

export type BoilStep = { atMinute: number; doneness: Doneness; count: number };

/**
 * When to put each kind of boiled egg in the pot so they are all done together.
 * The longest-cooking eggs go in at minute 0.
 */
export function boilPlan(lines: OrderLine[]): { steps: BoilStep[]; totalMinutes: number } {
  const counts = new Map<Doneness, number>();
  for (const l of lines) {
    if (l.spec.kind === "kokt") {
      counts.set(l.spec.doneness, (counts.get(l.spec.doneness) ?? 0) + l.count);
    }
  }
  const present = DONENESS.filter((o) => counts.has(o.value));
  if (present.length === 0) return { steps: [], totalMinutes: 0 };
  const totalMinutes = Math.max(...present.map((o) => o.minutes));
  const steps = present
    .map((o) => ({
      atMinute: totalMinutes - o.minutes,
      doneness: o.value,
      count: counts.get(o.value)!,
    }))
    .sort((a, b) => a.atMinute - b.atMinute);
  return { steps, totalMinutes };
}

/** Plain-text order for sharing in a chat. */
export function orderText(lines: OrderLine[]): string {
  const rows = groupBySpec(lines).map((g) => {
    const kind = g.spec.kind === "kokt" ? "kokt" : "stekt";
    const names = g.lines.map((l) => l.who).filter(Boolean);
    const forWho = names.length ? ` (${names.join(", ")})` : "";
    return `• ${g.count} × ${kind}, ${specLabel(g.spec).toLowerCase()}${forWho}`;
  });
  return [`Eggbestilling: ${totalEggs(lines)} egg`, ...rows].join("\n");
}

/** Validates data read back from storage; drops anything malformed. */
export function parseLines(raw: unknown): OrderLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isLine);
}

function isLine(x: unknown): x is OrderLine {
  if (typeof x !== "object" || x === null) return false;
  const l = x as Record<string, unknown>;
  if (typeof l.id !== "string" || typeof l.who !== "string") return false;
  if (typeof l.count !== "number" || !Number.isInteger(l.count) || l.count < 1) return false;
  const s = l.spec as Record<string, unknown> | null;
  if (typeof s !== "object" || s === null) return false;
  if (s.kind === "kokt") return DONENESS.some((o) => o.value === s.doneness);
  if (s.kind === "stekt") {
    return SIDES.some((o) => o.value === s.sides) && YOLK.some((o) => o.value === s.yolk);
  }
  return false;
}
