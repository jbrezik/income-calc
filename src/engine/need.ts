export type Item = { id: string; name: string; amount: number; enabled: boolean };

/** Group of expense items that can be switched off as a whole. */
export type Category = { id: string; name: string; enabled: boolean; items: Item[] };

export type Household = {
  categories: Category[];
  /** Other household income (partner, rent, benefits), net per month. */
  incomes: Item[];
  savings: number;
};

const enabledSum = (items: Item[]) => items.reduce((s, i) => s + (i.enabled ? i.amount : 0), 0);

/** Sum of enabled items; ignores the category switch. */
export const categoryTotal = (c: Category) => enabledSum(c.items);

export const expensesTotal = (h: Household) =>
  h.categories.reduce((s, c) => s + (c.enabled ? categoryTotal(c) : 0), 0);

export const incomesTotal = (h: Household) => enabledSum(h.incomes);

/** Monthly net income I must bring home to cover the household. */
export function monthlyNeed(h: Household): number {
  return Math.max(0, expensesTotal(h) + h.savings - incomesTotal(h));
}
