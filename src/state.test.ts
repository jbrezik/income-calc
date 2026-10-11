import { describe, expect, it } from "vitest";
import { DEFAULTS, parseState, serializeState } from "./state";

describe("state JSON", () => {
  it("round-trips through export and import", () => {
    expect(parseState(JSON.parse(serializeState(DEFAULTS)))).toEqual({
      ...DEFAULTS,
      household: { ...DEFAULTS.household, expenses: DEFAULTS.household.expenses.map((e, i) => ({ ...e, id: `e${i}` })) },
    });
  });

  it("export omits ids and UI-only fields", () => {
    const json = JSON.parse(serializeState(DEFAULTS));
    expect(json.openPanels).toBeUndefined();
    expect(json.household.expenses[0].id).toBeUndefined();
  });

  it("partial file overrides only given fields", () => {
    const s = parseState({ children: 3, household: { partnerNet: 1000, expenses: [{ name: "Nájem", amount: 15000 }] } });
    expect(s.children).toBe(3);
    expect(s.offerMd).toBe(DEFAULTS.offerMd);
    expect(s.household.partnerNet).toBe(1000);
    expect(s.household.groceries).toBe(DEFAULTS.household.groceries);
    expect(s.household.expenses).toEqual([{ id: "e0", name: "Nájem", amount: 15000, enabled: true }]);
  });

  it("ignores unknown keys", () => {
    expect(parseState({ foo: 1 })).toEqual(DEFAULTS);
  });

  it.each([
    [[1, 2], /objekt/],
    [{ children: "2" }, /children/],
    [{ offerHpp: -5 }, /offerHpp/],
    [{ sickness: "yes" }, /sickness/],
    [{ household: { expenses: [{ name: "X" }] } }, /expenses\[0\]\.amount/],
    [{ household: { expenses: {} } }, /expenses/],
  ])("rejects invalid %j", (raw, msg) => {
    expect(() => parseState(raw)).toThrow(msg);
  });
});
