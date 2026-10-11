import { describe, expect, it } from "vitest";
import { SAMPLE_HOUSEHOLD } from "../config/defaults";
import { monthlyNeed } from "./need";

const total = SAMPLE_HOUSEHOLD.expenses.reduce((s, e) => s + e.amount, 0);

describe("monthlyNeed", () => {
  it("expenses + groceries + savings - partner net", () => {
    const { groceries, savings, partnerNet } = SAMPLE_HOUSEHOLD;
    expect(monthlyNeed(SAMPLE_HOUSEHOLD)).toBe(total + groceries + savings - partnerNet);
  });

  it("skips disabled expenses", () => {
    const [first] = SAMPLE_HOUSEHOLD.expenses;
    const h = {
      ...SAMPLE_HOUSEHOLD,
      expenses: SAMPLE_HOUSEHOLD.expenses.map((e) => (e.id === first.id ? { ...e, enabled: false } : e)),
    };
    expect(monthlyNeed(h)).toBe(monthlyNeed(SAMPLE_HOUSEHOLD) - first.amount);
  });

  it("never goes below zero", () => {
    expect(monthlyNeed({ expenses: [], groceries: 0, savings: 0, partnerNet: 50000 })).toBe(0);
  });
});
