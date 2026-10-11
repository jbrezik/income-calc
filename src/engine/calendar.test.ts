import { describe, expect, it } from "vitest";
import { czechHolidays, easterSunday, workingDays } from "./calendar";

describe("calendar", () => {
  it("easter sunday", () => {
    expect(easterSunday(2025)).toEqual([4, 20]);
    expect(easterSunday(2026)).toEqual([4, 5]);
    expect(easterSunday(2027)).toEqual([3, 28]);
  });

  it("13 Czech public holidays incl. Good Friday and Easter Monday", () => {
    const h = czechHolidays(2026);
    expect(h).toHaveLength(13);
    expect(h).toContain("2026-04-03");
    expect(h).toContain("2026-04-06");
    expect(h).toContain("2026-09-28");
  });

  it("working days per month skip weekends and weekday holidays", () => {
    expect(workingDays(2026, 1)).toBe(21); // Jan 1 Thu
    expect(workingDays(2026, 4)).toBe(20); // Good Friday + Easter Monday
    expect(workingDays(2026, 5)).toBe(19); // May 1 + May 8 both Fri
    expect(workingDays(2026, 7)).toBe(22); // Jul 5 Sun, Jul 6 Mon
    expect(workingDays(2025, 12)).toBe(20); // Dec 24-26 Wed-Fri
  });

  it("working days per year", () => {
    const year = (y: number) => Array.from({ length: 12 }, (_, i) => workingDays(y, i + 1)).reduce((a, b) => a + b);
    expect(year(2025)).toBe(251);
    expect(year(2026)).toBe(250);
  });
});
