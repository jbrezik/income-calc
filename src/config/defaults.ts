import type { Category, Household, Item } from "../engine/need";
import type { WorkYear } from "../engine/worklog";

// Generic example data. Real numbers are loaded via JSON import and stay in the browser.
// Social and health insurance are computed by the engine per mode, not listed here.
const CATEGORIES: [string, [string, number][]][] = [
  ["Bydlení", [["Hypotéka", 25000], ["Energie", 4000]]],
  ["Domácnost", [["Jídlo a drogerie", 15000], ["Telefon", 800], ["Streaming", 300]]],
  ["Doprava", [["Palivo", 3000]]],
  ["Děti", [["Školné", 2000], ["Kapesné", 2000]]],
  ["Finance", [["Půjčka", 3000], ["Pojištění", 1500]]],
];

const items = (prefix: string, xs: [string, number][]): Item[] =>
  xs.map(([name, amount], i) => ({ id: `${prefix}${i}`, name, amount, enabled: true }));

export const SAMPLE_HOUSEHOLD: Household = {
  categories: CATEGORIES.map(([name, xs], i): Category => ({ id: `c${i}`, name, enabled: true, items: items(`c${i}i`, xs) })),
  incomes: items("inc", [["Příjem partnera", 25000]]),
  savings: 5000,
};

const pad = <T,>(xs: T[]) => [...xs, ...Array<null>(12 - xs.length).fill(null)];

export const SAMPLE_WORKLOG: WorkYear[] = [
  { year: 2026, hours: pad([150, 160, 168, 140, 152, 160]), rates: pad([800, 800, 800, 850, 850, 850]) },
];
