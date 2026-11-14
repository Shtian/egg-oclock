import { useCallback, useEffect, useState } from "react";
import {
  addLine,
  changeCount,
  normalizeName,
  parseLines,
  type EggSpec,
  type OrderLine,
} from "../lib/order";

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

/** The order, kept in localStorage so it survives closing the app. */
export function useOrder() {
  const [lines, setLines] = useState<OrderLine[]>(() => read(LINES_KEY, parseLines, []));
  const [names, setNames] = useState<string[]>(() => read(NAMES_KEY, parseNames, []));

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

  return { lines, names, add, change, replace: setLines };
}
