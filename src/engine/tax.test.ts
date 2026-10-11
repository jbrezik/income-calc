import { describe, expect, it } from "vitest";
import { TAX_YEARS } from "../config/taxYears";
import { hpp, osvc, type Person } from "./tax";

const y = TAX_YEARS[2026];
const twoKids: Person = { children: 2, mortgageInterest: 0, homeBefore2021: false };

describe("hpp", () => {
  it("100k gross, 2 kids", () => {
    const r = hpp(100000, y, twoKids);
    expect(r.annual.social).toBe(85200);
    expect(r.annual.health).toBe(54000);
    expect(r.annual.tax).toBe(180000 - 30840 - 15204 - 22320);
    expect(r.annual.net).toBe(949164);
    expect(r.netMonthly).toBeCloseTo(79097, 0);
    expect(r.employerCostMonthly).toBe(133800);
    expect(r.hourly).toBeCloseTo(100000 / 173.3, 2);
    expect(r.aboveHighRate).toBe(false);
  });

  it("200k gross: 23 % band and social cap", () => {
    const r = hpp(200000, y, twoKids);
    expect(r.annual.social).toBe(166880);
    expect(r.annual.tax).toBe(410976 - 30840 - 37524);
    expect(r.annual.net).toBe(1782508);
    expect(r.aboveHighRate).toBe(true);
  });

  it("min wage, 2 kids: child bonus", () => {
    const r = hpp(22400, y, twoKids);
    expect(r.annual.tax).toBe(-28044);
    expect(r.annual.net).toBe(265663);
  });

  it("no kids: taxpayer credit cannot go below zero", () => {
    const r = hpp(10000, y, { ...twoKids, children: 0 });
    expect(r.annual.tax).toBe(0);
  });

  it("third child uses 3rd+ credit", () => {
    const r = hpp(100000, y, { ...twoKids, children: 3 });
    expect(r.annual.tax).toBe(180000 - 30840 - 15204 - 22320 - 27840);
  });

  it("mortgage interest reduces base, capped at 150k", () => {
    expect(hpp(100000, y, { ...twoKids, mortgageInterest: 100000 }).annual.tax).toBe(96636);
    expect(hpp(100000, y, { ...twoKids, mortgageInterest: 200000 }).annual.tax).toBe(111636 - 22500);
    expect(hpp(100000, y, { ...twoKids, mortgageInterest: 200000, homeBefore2021: true }).annual.tax).toBe(
      111636 - 30000,
    );
  });
});

describe("osvc", () => {
  it("9 000/MD x 200 MD, 60 % flat expenses", () => {
    const r = osvc(9000, 200, y, twoKids, { sickness: false });
    expect(r.annual.revenue).toBe(1800000);
    expect(r.annual.profit).toBe(720000);
    expect(r.annual.social).toBe(115632);
    expect(r.annual.health).toBe(48600);
    expect(r.annual.tax).toBe(39636);
    expect(r.annual.net).toBe(1596132);
    expect(r.netMonthly).toBeCloseTo(133011, 0);
    expect(r.hourly).toBe(1125);
    expect(r.vatWarning).toBe(false);
  });

  it("flat expense cap and VAT warning above 2M", () => {
    const r = osvc(12500, 200, y, twoKids, { sickness: false });
    expect(r.annual.profit).toBe(1300000);
    expect(r.annual.net).toBe(2076834);
    expect(r.vatWarning).toBe(true);
  });

  it("low income: minimum insurance bases and child bonus", () => {
    const r = osvc(1500, 200, y, twoKids, { sickness: false });
    expect(r.annual.social).toBe(60056);
    expect(r.annual.health).toBe(39664);
    expect(r.annual.tax).toBe(-37524);
    expect(r.annual.net).toBe(237804);
  });

  it("optional sickness insurance", () => {
    const r = osvc(9000, 200, y, twoKids, { sickness: true });
    expect(r.annual.sickness).toBe(243 * 12);
    expect(r.annual.net).toBe(1596132 - 2916);
  });
});
