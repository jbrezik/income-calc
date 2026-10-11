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

/** Move an item to category `toCategory`, before item `beforeId` (null = append). Works within one category too. */
export function moveItem(categories: Category[], itemId: string, toCategory: string, beforeId: string | null): Category[] {
  const item = categories.flatMap((c) => c.items).find((i) => i.id === itemId);
  if (!item || itemId === beforeId) return categories;
  return categories
    .map((c) => ({ ...c, items: c.items.filter((i) => i.id !== itemId) }))
    .map((c) => {
      if (c.id !== toCategory) return c;
      const at = beforeId ? c.items.findIndex((i) => i.id === beforeId) : -1;
      const items = [...c.items];
      items.splice(at < 0 ? items.length : at, 0, item);
      return { ...c, items };
    });
}
