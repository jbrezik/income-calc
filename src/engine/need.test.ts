import { describe, expect, it } from "vitest";
import { categoryTotal, monthlyNeed, type Household } from "./need";

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
