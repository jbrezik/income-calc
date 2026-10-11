import { describe, expect, it } from "vitest";
import { monthlyNeed } from "./engine/need";
import { DEFAULTS, parseState, serializeState } from "./state";

describe("state JSON", () => {
  it("round-trips through export and import", () => {
    expect(parseState(JSON.parse(serializeState(DEFAULTS)))).toEqual(DEFAULTS);
  });

  it("export omits ids and UI-only fields", () => {
    const json = JSON.parse(serializeState(DEFAULTS));
    expect(json.openPanels).toBeUndefined();
    expect(json.household.categories[0].id).toBeUndefined();
    expect(json.household.categories[0].items[0].id).toBeUndefined();
    expect(json.household.incomes[0].id).toBeUndefined();
  });

  it("partial file overrides only given fields", () => {
    const s = parseState({ children: 3, household: { categories: [{ name: "Bydlení", items: [{ name: "Nájem", amount: 15000 }] }] } });
    expect(s.children).toBe(3);
    expect(s.offerMd).toBe(DEFAULTS.offerMd);
    expect(s.household.incomes).toEqual(DEFAULTS.household.incomes);
    expect(s.household.categories).toEqual([
      { id: "c0", name: "Bydlení", enabled: true, items: [{ id: "c0i0", name: "Nájem", amount: 15000, enabled: true }] },
    ]);
  });

  it("migrates v1 flat expenses, groceries and partner income", () => {
    const s = parseState({
      household: { expenses: [{ name: "Nájem", amount: 15000, enabled: true }], groceries: 10000, savings: 2000, partnerNet: 20000 },
    });
    expect(s.household.categories.map((c) => c.name)).toEqual(["Výdaje", "Domácnost"]);
    expect(s.household.incomes).toEqual([{ id: "inc0", name: "Příjem partnera", amount: 20000, enabled: true }]);
    expect(monthlyNeed(s.household)).toBe(15000 + 10000 + 2000 - 20000);
  });

  it("pads worklog months to 12", () => {
    const s = parseState({ worklog: [{ year: 2025, hours: [100, null], rates: [900] }] });
    expect(s.worklog[0].hours).toHaveLength(12);
    expect(s.worklog[0].hours.slice(0, 3)).toEqual([100, null, null]);
    expect(s.worklog[0].rates[0]).toBe(900);
  });

  it("ignores unknown keys", () => {
    expect(parseState({ foo: 1 })).toEqual(DEFAULTS);
  });

  it.each([
    [[1, 2], /objekt/],
    [{ children: "2" }, /children/],
    [{ offerHpp: -5 }, /offerHpp/],
    [{ sickness: "yes" }, /sickness/],
    [{ household: { categories: [{ name: "A", items: [{ name: "X" }] }] } }, /categories\[0\]\.items\[0\]\.amount/],
    [{ household: { categories: {} } }, /categories/],
    [{ worklog: [{ year: 2026, hours: ["x"] }] }, /worklog\[0\]\.hours\[0\]/],
    [{ worklog: [{ year: "2026" }] }, /worklog\[0\]\.year/],
  ])("rejects invalid %j", (raw, msg) => {
    expect(() => parseState(raw)).toThrow(msg);
  });
});
