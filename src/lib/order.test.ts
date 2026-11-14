import { describe, expect, it } from "vite-plus/test";
import {
  addLine,
  boilPlan,
  changeCount,
  groupBySpec,
  MAX_PER_LINE,
  orderText,
  parseLines,
  totalEggs,
  type EggSpec,
  type OrderLine,
} from "./order";

let n = 0;
const id = () => `id${++n}`;
const medium: EggSpec = { kind: "kokt", doneness: "medium" };
const soft: EggSpec = { kind: "kokt", doneness: "bløtkokt" };
const hard: EggSpec = { kind: "kokt", doneness: "hardkokt" };
const sunny: EggSpec = { kind: "stekt", sides: "en", yolk: "hel" };

describe("addLine", () => {
  it("merges the same egg for the same person, ignoring case and spacing", () => {
    let lines = addLine([], medium, 1, "Ola", id);
    lines = addLine(lines, medium, 2, "  ola ", id);
    expect(lines).toHaveLength(1);
    expect(lines[0].count).toBe(3);
  });

  it("keeps different people and different eggs apart", () => {
    let lines = addLine([], medium, 1, "Ola", id);
    lines = addLine(lines, medium, 1, "Kari", id);
    lines = addLine(lines, sunny, 1, "Ola", id);
    expect(lines).toHaveLength(3);
  });

  it("caps a line at the maximum", () => {
    const lines = addLine(addLine([], medium, 10, "", id), medium, 10, "", id);
    expect(lines[0].count).toBe(MAX_PER_LINE);
  });
});

describe("changeCount", () => {
  it("removes the line when it reaches zero", () => {
    const lines = addLine([], medium, 1, "", id);
    expect(changeCount(lines, lines[0].id, -1)).toEqual([]);
  });
});

describe("groupBySpec", () => {
  it("sums across people and puts boiled before fried", () => {
    let lines: OrderLine[] = [];
    lines = addLine(lines, sunny, 1, "A", id);
    lines = addLine(lines, medium, 2, "A", id);
    lines = addLine(lines, medium, 1, "B", id);
    const groups = groupBySpec(lines);
    expect(groups.map((g) => g.key)).toEqual(["kokt:medium", "stekt:en:hel"]);
    expect(groups[0].count).toBe(3);
    expect(totalEggs(lines)).toBe(4);
  });
});

describe("boilPlan", () => {
  it("staggers start times so everything is done together", () => {
    let lines: OrderLine[] = [];
    lines = addLine(lines, soft, 2, "", id);
    lines = addLine(lines, hard, 1, "", id);
    lines = addLine(lines, sunny, 1, "", id);
    const plan = boilPlan(lines);
    expect(plan.totalMinutes).toBe(10);
    expect(plan.steps).toEqual([
      { atMinute: 0, doneness: "hardkokt", count: 1 },
      { atMinute: 4, doneness: "bløtkokt", count: 2 },
    ]);
  });

  it("is empty without boiled eggs", () => {
    expect(boilPlan(addLine([], sunny, 1, "", id)).steps).toEqual([]);
  });
});

describe("orderText", () => {
  it("lists totals and names", () => {
    const lines = addLine(addLine([], medium, 2, "Ola", id), sunny, 1, "", id);
    expect(orderText(lines)).toBe(
      "Eggbestilling: 3 egg\n• 2 × kokt, medium (Ola)\n• 1 × stekt, én side",
    );
  });
});

describe("parseLines", () => {
  it("drops malformed entries from storage", () => {
    const good = { id: "a", who: "", count: 1, spec: medium };
    expect(
      parseLines([good, { id: "b", who: "", count: 0, spec: medium }, { id: "c" }, null]),
    ).toEqual([good]);
    expect(parseLines("nope")).toEqual([]);
  });
});
