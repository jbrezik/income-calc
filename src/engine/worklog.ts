import { HOURS_PER_DAY, workingDays } from "./calendar";

/** Hours worked and hourly rate per month (index 0 = January); null = not filled in yet. */
export type WorkYear = { year: number; hours: (number | null)[]; rates: (number | null)[] };

export type MonthStat = {
  month: number;
  /** Working hours in the month (working days x 8). */
  available: number;
  hours: number;
  rate: number;
  revenue: number;
  /** Hours not filled in; estimated from utilization. */
  projected: boolean;
};

type Totals = { hours: number; revenue: number; available: number };

export type YearStats = {
  year: number;
  months: MonthStat[];
  /** Filled-in months only. */
  actual: Totals;
  /** Actual + projected. */
  total: Totals;
  /** Actual hours / available hours of filled months. */
  utilization: number;
  /** Actual revenue / actual hours. */
  avgRate: number;
  /** Rate of the last month with a rate. */
  lastRate: number;
};

export type Fallback = { utilization: number; rate: number };

export const emptyWorkYear = (year: number): WorkYear => ({ year, hours: Array(12).fill(null), rates: Array(12).fill(null) });

const sum = (ms: MonthStat[], k: keyof Totals) => ms.reduce((s, m) => s + m[k], 0);
const totals = (ms: MonthStat[]): Totals => ({ hours: sum(ms, "hours"), revenue: sum(ms, "revenue"), available: sum(ms, "available") });

/**
 * Year statistics. Months without hours are projected as available x utilization of the filled months,
 * at the last rate known up to that month. With no filled months, `fallback` (e.g. previous year) is used.
 */
export function yearStats(w: WorkYear, fallback?: Fallback): YearStats {
  const available = Array.from({ length: 12 }, (_, i) => workingDays(w.year, i + 1) * HOURS_PER_DAY);
  const filled = available.map((_, i) => w.hours[i] != null);
  const actualHours = w.hours.reduce<number>((s, h) => s + (h ?? 0), 0);
  const actualAvailable = available.reduce((s, a, i) => s + (filled[i] ? a : 0), 0);
  const utilization = actualAvailable > 0 ? actualHours / actualAvailable : (fallback?.utilization ?? 0);

  let rate = fallback?.rate ?? 0;
  const months = available.map((avail, i): MonthStat => {
    rate = w.rates[i] ?? rate;
    const projected = !filled[i];
    const hours = projected ? Math.round(avail * utilization) : (w.hours[i] as number);
    return { month: i + 1, available: avail, hours, rate, revenue: hours * rate, projected };
  });

  const actual = totals(months.filter((m) => !m.projected));
  return {
    year: w.year,
    months,
    actual,
    total: totals(months),
    utilization,
    avgRate: actual.hours > 0 ? actual.revenue / actual.hours : rate,
    lastRate: rate,
  };
}
