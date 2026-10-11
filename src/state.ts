import { SAMPLE_HOUSEHOLD } from "./config/defaults";
import type { Expense, Household } from "./engine/need";

export type AppState = {
  household: Household;
  year: number;
  children: number;
  claimChildren: boolean;
  /** Annual mortgage interest. */
  mortgageInterest: number;
  homeBefore2021: boolean;
  mdPerYear: number;
  sickness: boolean;
  offerHpp: number;
  offerMd: number;
  openPanels: { expenses: boolean; tax: boolean };
};

export const DEFAULTS: AppState = {
  household: SAMPLE_HOUSEHOLD,
  year: 2026,
  children: 1,
  claimChildren: true,
  mortgageInterest: 0,
  homeBefore2021: false,
  mdPerYear: 200,
  sickness: false,
  offerHpp: 60000,
  offerMd: 6000,
  openPanels: { expenses: true, tax: true },
};

/** JSON for export: inputs only, no ids or UI state, so the file stays hand-editable. */
export function serializeState(s: AppState): string {
  const { openPanels: _ui, household, ...rest } = s;
  const expenses = household.expenses.map(({ id: _id, ...e }) => e);
  return JSON.stringify({ ...rest, household: { ...household, expenses } }, null, 2);
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function num(o: Obj, key: string, fallback: number, path = key): number {
  const v = o[key];
  if (v === undefined) return fallback;
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) throw new Error(`Neplatná hodnota ${path}: čekám nezáporné číslo.`);
  return v;
}

function bool(o: Obj, key: string, fallback: boolean, path = key): boolean {
  const v = o[key];
  if (v === undefined) return fallback;
  if (typeof v !== "boolean") throw new Error(`Neplatná hodnota ${path}: čekám true/false.`);
  return v;
}

function parseExpense(raw: unknown, i: number): Expense {
  const path = `household.expenses[${i}]`;
  if (!isObj(raw) || typeof raw.name !== "string") throw new Error(`Neplatná položka ${path}: chybí name.`);
  if (raw.amount === undefined) throw new Error(`Neplatná hodnota ${path}.amount: chybí.`);
  return {
    id: `e${i}`,
    name: raw.name,
    amount: num(raw, "amount", 0, `${path}.amount`),
    enabled: bool(raw, "enabled", true, `${path}.enabled`),
  };
}

function parseHousehold(raw: unknown): Household {
  const d = DEFAULTS.household;
  if (raw === undefined) return d;
  if (!isObj(raw)) throw new Error("Neplatná hodnota household: čekám objekt.");
  if (raw.expenses !== undefined && !Array.isArray(raw.expenses)) throw new Error("Neplatná hodnota household.expenses: čekám pole.");
  return {
    expenses: raw.expenses ? (raw.expenses as unknown[]).map(parseExpense) : d.expenses,
    groceries: num(raw, "groceries", d.groceries, "household.groceries"),
    savings: num(raw, "savings", d.savings, "household.savings"),
    partnerNet: num(raw, "partnerNet", d.partnerNet, "household.partnerNet"),
  };
}

/** Imported JSON -> state. Missing fields fall back to defaults; unknown keys are ignored; bad types throw. */
export function parseState(raw: unknown): AppState {
  if (!isObj(raw)) throw new Error("Soubor musí obsahovat JSON objekt.");
  const d = DEFAULTS;
  return {
    household: parseHousehold(raw.household),
    year: num(raw, "year", d.year),
    children: num(raw, "children", d.children),
    claimChildren: bool(raw, "claimChildren", d.claimChildren),
    mortgageInterest: num(raw, "mortgageInterest", d.mortgageInterest),
    homeBefore2021: bool(raw, "homeBefore2021", d.homeBefore2021),
    mdPerYear: num(raw, "mdPerYear", d.mdPerYear),
    sickness: bool(raw, "sickness", d.sickness),
    offerHpp: num(raw, "offerHpp", d.offerHpp),
    offerMd: num(raw, "offerMd", d.offerMd),
    openPanels: d.openPanels,
  };
}
