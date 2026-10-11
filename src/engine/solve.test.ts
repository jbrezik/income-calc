import { describe, expect, it } from "vitest";
import { TAX_YEARS } from "../config/taxYears";
import { minHppGross, minMdRate } from "./solve";
import { hpp, osvc, type Person } from "./tax";

const y = TAX_YEARS[2026];
const p: Person = { children: 2, mortgageInterest: 0, homeBefore2021: false };
const opts = { sickness: false };

describe("solver", () => {
  // Tax base rounds down to 100 CZK, so net wobbles by a few CZK; allow that slack.
  it("HPP: known net maps back to about its gross", () => {
    expect(minHppGross(79097, y, p)).toBeGreaterThan(99900);
    expect(minHppGross(79097, y, p)).toBeLessThanOrEqual(100000);
  });

  it("OSVČ: exact known net maps back to its MD rate", () => {
    expect(minMdRate(133011, 200, y, p, opts)).toBe(9000);
  });

  it.each([0, 30000, 105763, 250000])("HPP minimum gross for need %i is tight", (need) => {
    const g = minHppGross(need, y, p);
    expect(hpp(g, y, p).netMonthly).toBeGreaterThanOrEqual(need);
    if (g > 0) expect(hpp(g - 1, y, p).netMonthly).toBeLessThan(need);
  });

  it.each([0, 30000, 105763, 250000])("OSVČ minimum MD rate for need %i is tight", (need) => {
    const r = minMdRate(need, 200, y, p, opts);
    expect(osvc(r, 200, y, p, opts).netMonthly).toBeGreaterThanOrEqual(need);
    if (r > 0) expect(osvc(r - 1, 200, y, p, opts).netMonthly).toBeLessThan(need);
  });
});
