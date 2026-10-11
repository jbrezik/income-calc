import { SAMPLE_HOUSEHOLD, SAMPLE_WORKLOG } from "./config/defaults";
import type { Category, Household, Item } from "./engine/need";
import type { WorkYear } from "./engine/worklog";

export type AppState = {
  household: Household;
  worklog: WorkYear[];
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
  openPanels: { expenses: boolean; tax: boolean; stats: boolean };
};

export const DEFAULTS: AppState = {
  household: SAMPLE_HOUSEHOLD,
  worklog: SAMPLE_WORKLOG,
  year: 2026,
  children: 1,
  claimChildren: true,
  mortgageInterest: 0,
  homeBefore2021: false,
  mdPerYear: 200,
  sickness: false,
  offerHpp: 60000,
  offerMd: 6000,
  openPanels: { expenses: true, tax: true, stats: true },
};

const stripIds = (xs: Item[]) => xs.map(({ id: _id, ...x }) => x);

/** JSON for export: inputs only, no ids or UI state, so the file stays hand-editable. */
export function serializeState(s: AppState): string {
  const { openPanels: _ui, household: h, ...rest } = s;
  const household = {
    savings: h.savings,
    incomes: stripIds(h.incomes),
    categories: h.categories.map(({ id: _id, items, ...c }) => ({ ...c, items: stripIds(items) })),
  };
  return JSON.stringify({ ...rest, household }, null, 2);
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const fail = (path: string, expected: string): never => {
  throw new Error(`Neplatná hodnota ${path}: čekám ${expected}.`);
};

function num(o: Obj, key: string, fallback: number, path = key): number {
  const v = o[key];
  if (v === undefined) return fallback;
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return fail(path, "nezáporné číslo");
  return v;
}

function bool(o: Obj, key: string, fallback: boolean, path = key): boolean {
  const v = o[key];
  if (v === undefined) return fallback;
  return typeof v === "boolean" ? v : fail(path, "true/false");
}

function arr(o: Obj, key: string, path: string): unknown[] | undefined {
  const v = o[key];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : fail(path, "pole");
}

function parseItem(raw: unknown, id: string, path: string): Item {
  if (!isObj(raw) || typeof raw.name !== "string") return fail(`${path}.name`, "text");
  if (raw.amount === undefined) return fail(`${path}.amount`, "číslo");
  return { id, name: raw.name, amount: num(raw, "amount", 0, `${path}.amount`), enabled: bool(raw, "enabled", true, `${path}.enabled`) };
}

function parseCategory(raw: unknown, i: number): Category {
  const path = `household.categories[${i}]`;
  if (!isObj(raw) || typeof raw.name !== "string") return fail(`${path}.name`, "text");
  const items = arr(raw, "items", `${path}.items`) ?? [];
  return {
    id: `c${i}`,
    name: raw.name,
    enabled: bool(raw, "enabled", true, `${path}.enabled`),
    items: items.map((x, j) => parseItem(x, `c${i}i${j}`, `${path}.items[${j}]`)),
  };
}

function parseHousehold(raw: unknown): Household {
  const d = DEFAULTS.household;
  if (raw === undefined) return d;
  if (!isObj(raw)) return fail("household", "objekt");
  const categories = arr(raw, "categories", "household.categories");
  const incomes = arr(raw, "incomes", "household.incomes");
  // v1 format: flat `expenses`, `groceries`, `partnerNet`.
  const expenses = arr(raw, "expenses", "household.expenses");
  const v1Categories = expenses && [
    { name: "Výdaje", items: expenses },
    ...(raw.groceries !== undefined ? [{ name: "Domácnost", items: [{ name: "Jídlo a domácnost", amount: raw.groceries }] }] : []),
  ];
  const v1Incomes = raw.partnerNet !== undefined ? [{ name: "Příjem partnera", amount: raw.partnerNet }] : undefined;
  const cats = categories ?? v1Categories;
  const incs = incomes ?? v1Incomes;
  return {
    categories: cats ? cats.map(parseCategory) : d.categories,
    incomes: incs ? incs.map((x, j) => parseItem(x, `inc${j}`, `household.incomes[${j}]`)) : d.incomes,
    savings: num(raw, "savings", d.savings, "household.savings"),
  };
}

function parseMonths(raw: Obj, key: string, path: string): (number | null)[] {
  const xs = arr(raw, key, `${path}.${key}`) ?? [];
  if (xs.length > 12) fail(`${path}.${key}`, "nejvýše 12 měsíců");
  const out = xs.map((v, i) => (v === null ? null : num({ v }, "v", 0, `${path}.${key}[${i}]`)));
  return [...out, ...Array<null>(12 - out.length).fill(null)];
}

function parseWorklog(raw: unknown): WorkYear[] {
  if (raw === undefined) return DEFAULTS.worklog;
  if (!Array.isArray(raw)) return fail("worklog", "pole");
  return raw.map((y, i) => {
    const path = `worklog[${i}]`;
    if (!isObj(y) || !Number.isInteger(y.year)) return fail(`${path}.year`, "rok");
    return { year: y.year as number, hours: parseMonths(y, "hours", path), rates: parseMonths(y, "rates", path) };
  });
}

function parsePanels(raw: unknown): AppState["openPanels"] {
  const d = DEFAULTS.openPanels;
  if (!isObj(raw)) return d;
  return { expenses: bool(raw, "expenses", d.expenses), tax: bool(raw, "tax", d.tax), stats: bool(raw, "stats", d.stats) };
}

/** Imported JSON -> state. Missing fields fall back to defaults; unknown keys are ignored; bad types throw. */
export function parseState(raw: unknown): AppState {
  if (!isObj(raw)) throw new Error("Soubor musí obsahovat JSON objekt.");
  const d = DEFAULTS;
  return {
    household: parseHousehold(raw.household),
    worklog: parseWorklog(raw.worklog),
    year: num(raw, "year", d.year),
    children: num(raw, "children", d.children),
    claimChildren: bool(raw, "claimChildren", d.claimChildren),
    mortgageInterest: num(raw, "mortgageInterest", d.mortgageInterest),
    homeBefore2021: bool(raw, "homeBefore2021", d.homeBefore2021),
    mdPerYear: num(raw, "mdPerYear", d.mdPerYear),
    sickness: bool(raw, "sickness", d.sickness),
    offerHpp: num(raw, "offerHpp", d.offerHpp),
    offerMd: num(raw, "offerMd", d.offerMd),
    openPanels: parsePanels(raw.openPanels),
  };
}
