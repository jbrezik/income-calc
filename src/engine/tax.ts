import type { TaxYear } from "../config/taxYears";

/** Personal tax situation, shared by both modes. */
export type Person = {
  children: number;
  /** Annual mortgage interest paid. */
  mortgageInterest: number;
  /** Home acquired before 2021 raises the interest cap. */
  homeBefore2021: boolean;
};

/** 40 h x 52 weeks / 12. */
export const HPP_HOURS_PER_MONTH = 173.3;
export const MD_HOURS = 8;

// Round to cents first so float noise (54000.0000001) does not round up a whole koruna.
const ceilCzk = (x: number) => Math.ceil(Math.round(x * 100) / 100);
const floor100 = (x: number) => Math.floor(x / 100) * 100;

function childCredit(year: TaxYear, children: number): number {
  let total = 0;
  for (let i = 0; i < children; i++) total += year.childCredits[Math.min(i, 2)];
  return total;
}

/**
 * Annual income tax after credits. Negative = child bonus paid out.
 * `income` is gross wage (HPP) or revenue (OSVČ), used for the bonus eligibility test.
 */
export function incomeTax(base: number, income: number, year: TaxYear, p: Person): number {
  const cap = p.homeBefore2021 ? year.mortgageCapPre2021 : year.mortgageCap;
  const reduced = floor100(Math.max(0, base - Math.min(p.mortgageInterest, cap)));
  const high = Math.max(0, reduced - year.highRateThreshold);
  const gross = ceilCzk(0.15 * (reduced - high) + 0.23 * high);
  const afterTaxpayer = Math.max(0, gross - year.creditTaxpayer);
  const kids = childCredit(year, p.children);
  const afterKids = afterTaxpayer - kids;
  if (afterKids >= 0) return afterKids;
  const bonus = -afterKids;
  return income >= year.childBonusMinIncome && bonus >= 100 ? -bonus : 0;
}

export type HppResult = {
  annual: {
    gross: number;
    social: number;
    health: number;
    tax: number;
    net: number;
    employerSocial: number;
    employerHealth: number;
    employerCost: number;
  };
  netMonthly: number;
  employerCostMonthly: number;
  hourly: number;
  /** Part of the income falls into the 23 % band. */
  aboveHighRate: boolean;
};

/** Employee (HPP) from monthly gross, settled annually (roční zúčtování). */
export function hpp(grossMonthly: number, year: TaxYear, p: Person): HppResult {
  const gross = grossMonthly * 12;
  const socialBase = Math.min(gross, year.maxSocialBase);
  const social = ceilCzk(socialBase * year.hpp.socialEmployee);
  const health = ceilCzk(gross * year.hpp.healthEmployee);
  const employerSocial = ceilCzk(socialBase * year.hpp.socialEmployer);
  const employerHealth = ceilCzk(gross * year.hpp.healthTotal) - health;
  const tax = incomeTax(gross, gross, year, p);
  const net = gross - social - health - tax;
  const employerCost = gross + employerSocial + employerHealth;
  return {
    annual: { gross, social, health, tax, net, employerSocial, employerHealth, employerCost },
    netMonthly: net / 12,
    employerCostMonthly: employerCost / 12,
    hourly: grossMonthly / HPP_HOURS_PER_MONTH,
    aboveHighRate: gross > year.highRateThreshold,
  };
}

export type OsvcOptions = { sickness: boolean };

export type OsvcRevenueResult = {
  annual: {
    revenue: number;
    expenses: number;
    profit: number;
    social: number;
    health: number;
    sickness: number;
    tax: number;
    net: number;
  };
  netMonthly: number;
  aboveHighRate: boolean;
  /** Turnover crosses the VAT registration threshold. */
  vatWarning: boolean;
};

export type OsvcResult = OsvcRevenueResult & { hourly: number };

/** Self-employed (OSVČ) from MD rate x billable MD per year. */
export function osvc(mdRate: number, mdPerYear: number, year: TaxYear, p: Person, opts: OsvcOptions): OsvcResult {
  return { ...osvcFromRevenue(mdRate * mdPerYear, year, p, opts), hourly: mdRate / MD_HOURS };
}

/** Self-employed (OSVČ, hlavní činnost) with flat-rate expenses (výdajový paušál), from annual revenue. */
export function osvcFromRevenue(revenue: number, year: TaxYear, p: Person, opts: OsvcOptions): OsvcRevenueResult {
  const o = year.osvc;
  const expenses = Math.min(revenue * o.flatExpenseRate, o.flatExpenseCap);
  const profit = revenue - expenses;
  const socialBase = Math.min(Math.max(profit * o.socialBaseShare, o.socialMinBaseMonthly * 12), year.maxSocialBase);
  const social = ceilCzk(socialBase * o.socialRate);
  const health = ceilCzk(Math.max(profit * o.healthBaseShare, o.healthMinBaseMonthly * 12) * o.healthRate);
  const sickness = opts.sickness ? o.sicknessMonthly * 12 : 0;
  const tax = incomeTax(profit, revenue, year, p);
  const net = revenue - social - health - sickness - tax;
  return {
    annual: { revenue, expenses, profit, social, health, sickness, tax, net },
    netMonthly: net / 12,
    aboveHighRate: profit > year.highRateThreshold,
    vatWarning: revenue > year.vatThreshold,
  };
}
