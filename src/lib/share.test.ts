import { describe, expect, it } from "vite-plus/test";
import { addLine, type EggSpec, type OrderLine } from "./order";
import { linesFromSearch, mergeNames, shareUrl } from "./share";

let n = 0;
const id = () => `id${++n}`;
const strip = (lines: OrderLine[]) => lines.map(({ spec, count, who }) => ({ spec, count, who }));

const specs: EggSpec[] = [
  { kind: "kokt", doneness: "bløtkokt" },
  { kind: "kokt", doneness: "medium" },
  { kind: "kokt", doneness: "hardkokt" },
  { kind: "stekt", sides: "en", yolk: "hel" },
  { kind: "stekt", sides: "en", yolk: "knust" },
  { kind: "stekt", sides: "begge", yolk: "hel" },
  { kind: "stekt", sides: "begge", yolk: "knust" },
];

describe("shareUrl / linesFromSearch", () => {
  it("round-trips every kind of egg, counts and names", () => {
    let lines: OrderLine[] = [];
    specs.forEach((spec, i) => {
      lines = addLine(lines, spec, i + 1, i % 2 ? `Åse M. ${i}` : "", id);
    });
    const url = new URL(shareUrl(lines, "https://egg.example/?old=1#x"));
    expect(url.origin + url.pathname).toBe("https://egg.example/");
    expect(url.hash).toBe("");
    expect(strip(linesFromSearch(url.search, id))).toEqual(strip(lines));
  });

  it("skips malformed lines and clamps counts", () => {
    const lines = linesFromSearch("?e=km.2.Ola&e=zz.1&e=kh.0&e=kb.x&e=s2k.99", id);
    expect(strip(lines)).toEqual([
      { spec: { kind: "kokt", doneness: "medium" }, count: 2, who: "Ola" },
      { spec: { kind: "stekt", sides: "begge", yolk: "knust" }, count: 12, who: "" },
    ]);
  });
});

describe("mergeNames", () => {
  it("keeps saved names in place and appends only new ones", () => {
    expect(mergeNames(["Kari", "Ola"], ["ola", "Per", "", "Per"])).toEqual(["Kari", "Ola", "Per"]);
  });
});
