import type { Household } from "../engine/need";

// Generic example household. Real numbers are loaded via JSON import and stay in the browser.
// Social and health insurance are computed by the engine per mode, not listed here.
const ITEMS: [string, number][] = [
  ["Energie", 4000],
  ["Hypotéka", 25000],
  ["Telefon", 800],
  ["Streaming", 300],
  ["Doprava", 3000],
  ["Školné", 2000],
  ["Půjčka", 3000],
  ["Pojištění", 1500],
  ["Kapesné", 2000],
];

export const SAMPLE_HOUSEHOLD: Household = {
  expenses: ITEMS.map(([name, amount], i) => ({ id: `e${i}`, name, amount, enabled: true })),
  groceries: 15000,
  savings: 5000,
  partnerNet: 25000,
};
