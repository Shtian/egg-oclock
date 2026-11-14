import { useCallback, useEffect, useState } from "react";
import {
  addLine,
  changeCount,
  normalizeName,
  parseLines,
  type EggSpec,
  type OrderLine,
} from "../lib/order";
import { mergeNames } from "../lib/share";

const LINES_KEY = "egg-oclock:order";
const NAMES_KEY = "egg-oclock:names";
const MAX_NAMES = 8;

function read<T>(key: string, parse: (raw: unknown) => T, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? parse(JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or full storage: the order still works for this session.
  }
}

const parseNames = (raw: unknown) =>
  Array.isArray(raw) ? raw.filter((n): n is string => typeof n === "string") : [];

/**
 * The order, kept in localStorage so it survives closing the app.
 * A `shared` order (opened from a link) replaces the saved one; `previous` is
 * the order it replaced, for undo. Its names are added to the saved names.
 */
export function useOrder(shared: OrderLine[] | null = null) {
  const [start] = useState(() => {
    const stored = read(LINES_KEY, parseLines, []);
    const savedNames = read(NAMES_KEY, parseNames, []);
    if (!shared) return { lines: stored, names: savedNames, previous: null };
    return {
      lines: shared,
      names: mergeNames(
        savedNames,
        shared.map((l) => l.who),
      ),
      previous: stored,
    };
  });
  const [lines, setLines] = useState<OrderLine[]>(start.lines);
  const [names, setNames] = useState<string[]>(start.names);

  useEffect(() => write(LINES_KEY, lines), [lines]);
  useEffect(() => write(NAMES_KEY, names), [names]);

  const add = useCallback((spec: EggSpec, count: number, who: string) => {
    setLines((prev) => addLine(prev, spec, count, who, () => crypto.randomUUID()));
    const name = normalizeName(who);
    if (name) {
      setNames((prev) =>
        [
          name,
          ...prev.filter((n) => n.toLocaleLowerCase("nb") !== name.toLocaleLowerCase("nb")),
        ].slice(0, MAX_NAMES),
      );
    }
  }, []);

  const change = useCallback((id: string, delta: number) => {
    setLines((prev) => changeCount(prev, id, delta));
  }, []);

  const removeName = useCallback((name: string) => {
    setNames((prev) => prev.filter((n) => n !== name));
  }, []);

  return {
    lines,
    names,
    add,
    change,
    replace: setLines,
    removeName,
    replaceNames: setNames,
    previous: start.previous,
  };
}
