import { describe, expect, it } from "vitest";
import { categoryTotal, monthlyNeed, moveItem, type Household } from "./need";

const item = (id: string, amount: number, enabled = true) => ({ id, name: id, amount, enabled });

const h: Household = {
  categories: [
    { id: "c1", name: "Bydlení", enabled: true, items: [item("a", 20000), item("b", 5000)] },
    { id: "c2", name: "Auto", enabled: true, items: [item("c", 3000), item("d", 1000, false)] },
  ],
  incomes: [item("partner", 20000), item("rent", 4000, false)],
  savings: 5000,
};

describe("monthlyNeed", () => {
  it("enabled items + savings - enabled incomes", () => {
    expect(monthlyNeed(h)).toBe(25000 + 3000 + 5000 - 20000);
  });

  it("disabled category drops all its items", () => {
    const off = { ...h, categories: h.categories.map((c) => (c.id === "c2" ? { ...c, enabled: false } : c)) };
    expect(monthlyNeed(off)).toBe(25000 + 5000 - 20000);
  });

  it("category total counts enabled items regardless of category switch", () => {
    expect(categoryTotal(h.categories[1])).toBe(3000);
  });

  it("never goes below zero", () => {
    expect(monthlyNeed({ categories: [], incomes: [item("x", 50000)], savings: 0 })).toBe(0);
  });
});

describe("moveItem", () => {
  const ids = (cs: Household["categories"]) => cs.map((c) => c.items.map((i) => i.id));

  it("moves to another category before a given item", () => {
    expect(ids(moveItem(h.categories, "a", "c2", "d"))).toEqual([["b"], ["c", "a", "d"]]);
  });

  it("appends when no target item", () => {
    expect(ids(moveItem(h.categories, "b", "c2", null))).toEqual([["a"], ["c", "d", "b"]]);
  });

  it("reorders within a category", () => {
    expect(ids(moveItem(h.categories, "b", "c1", "a"))).toEqual([["b", "a"], ["c", "d"]]);
  });

  it("keeps the item's own fields", () => {
    const moved = moveItem(h.categories, "d", "c1", null)[0].items.at(-1);
    expect(moved).toEqual(h.categories[1].items[1]);
  });

  it("no-op for unknown item or drop onto itself", () => {
    expect(ids(moveItem(h.categories, "zzz", "c2", null))).toEqual([["a", "b"], ["c", "d"]]);
    expect(ids(moveItem(h.categories, "a", "c1", "a"))).toEqual([["a", "b"], ["c", "d"]]);
  });
});
