import { describe, expect, it } from "vitest";
import { taxYearFor } from "./taxYears";

describe("taxYearFor", () => {
  it("exact or nearest known year", () => {
    expect(taxYearFor(2026).year).toBe(2026);
    expect(taxYearFor(2027).year).toBe(2027);
    expect(taxYearFor(2025).year).toBe(2026);
    expect(taxYearFor(2030).year).toBe(2027);
  });
});
