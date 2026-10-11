import { describe, expect, it } from "vitest";
import { emptyWorkYear, yearStats, type WorkYear } from "./worklog";

const months = <T,>(xs: T[]) => [...xs, ...Array(12 - xs.length).fill(null)];

// Synthetic: Jan full (168 of 168 h), Feb half (80 of 160 h), Mar has a new rate but no hours yet.
const y2026: WorkYear = { year: 2026, hours: months([168, 80]), rates: months([1000, 1000, 1100]) };

describe("yearStats", () => {
  const s = yearStats(y2026);

  it("actual months: hours x rate, available from working days", () => {
    expect(s.months[0]).toMatchObject({ available: 168, hours: 168, rate: 1000, revenue: 168000, projected: false });
    expect(s.months[1]).toMatchObject({ available: 160, hours: 80, revenue: 80000, projected: false });
    expect(s.actual).toEqual({ hours: 248, revenue: 248000, available: 328 });
    expect(s.utilization).toBeCloseTo(248 / 328);
    expect(s.avgRate).toBe(1000);
  });

  it("projects empty months: available x utilization at last known rate", () => {
    expect(s.months[2]).toMatchObject({ available: 176, hours: 133, rate: 1100, revenue: 146300, projected: true });
    expect(s.months[3]).toMatchObject({ available: 160, hours: 121, rate: 1100, projected: true });
  });

  it("year total = actual + projected", () => {
    expect(s.total.available).toBe(2000);
    expect(s.total.revenue).toBe(s.months.reduce((sum, m) => sum + m.revenue, 0));
    expect(s.total.hours).toBe(s.months.reduce((sum, m) => sum + m.hours, 0));
  });

  it("empty year uses fallback from previous year", () => {
    const e = yearStats(emptyWorkYear(2027), { utilization: 0.5, rate: 900 });
    expect(e.months[0]).toMatchObject({ hours: Math.round(e.months[0].available / 2), rate: 900, projected: true });
  });

  it("empty year without fallback projects nothing", () => {
    expect(yearStats(emptyWorkYear(2027)).total.revenue).toBe(0);
  });
});
