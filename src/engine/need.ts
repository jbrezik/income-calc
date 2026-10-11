export type Expense = { id: string; name: string; amount: number; enabled: boolean };

export type Household = {
  expenses: Expense[];
  groceries: number;
  savings: number;
  /** Partner's monthly net income, offsets the need. */
  partnerNet: number;
};

/** Monthly net income I must bring home to cover the household. */
export function monthlyNeed(h: Household): number {
  const expenses = h.expenses.filter((e) => e.enabled).reduce((sum, e) => sum + e.amount, 0);
  return Math.max(0, expenses + h.groceries + h.savings - h.partnerNet);
}
