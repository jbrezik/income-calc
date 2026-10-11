// Sources: docs/research/cz-tax-2026.md

export type TaxYear = {
  year: number;
  avgWage: number;
  minWage: number;
  /** Annual tax base above which 23 % applies (36x avg wage). */
  highRateThreshold: number;
  creditTaxpayer: number;
  /** Annual child credit for 1st, 2nd, 3rd+ child. */
  childCredits: [number, number, number];
  /** Min annual income (6x min wage) to receive child bonus. */
  childBonusMinIncome: number;
  mortgageCap: number;
  mortgageCapPre2021: number;
  maxSocialBase: number;
  hpp: { socialEmployee: number; healthEmployee: number; socialEmployer: number; healthTotal: number };
  osvc: {
    flatExpenseRate: number;
    flatExpenseCap: number;
    socialRate: number;
    socialBaseShare: number;
    socialMinBaseMonthly: number;
    healthRate: number;
    healthBaseShare: number;
    healthMinBaseMonthly: number;
    /** Minimum voluntary sickness insurance per month. */
    sicknessMonthly: number;
  };
  vatThreshold: number;
};

const shared = {
  creditTaxpayer: 30840,
  childCredits: [15204, 22320, 27840] as [number, number, number],
  mortgageCap: 150000,
  mortgageCapPre2021: 300000,
  hpp: { socialEmployee: 0.071, healthEmployee: 0.045, socialEmployer: 0.248, healthTotal: 0.135 },
  vatThreshold: 2000000,
};

const osvcShared = {
  flatExpenseRate: 0.6,
  flatExpenseCap: 1200000,
  socialRate: 0.292,
  socialBaseShare: 0.55,
  healthRate: 0.135,
  healthBaseShare: 0.5,
};

export const TAX_YEARS: Record<number, TaxYear> = {
  2026: {
    ...shared,
    year: 2026,
    avgWage: 48967,
    minWage: 22400,
    highRateThreshold: 1762812,
    childBonusMinIncome: 134400,
    maxSocialBase: 2350416,
    // Min social base 35 % of avg wage (zákon 90/2026 Sb. reverted the planned 40 %).
    osvc: { ...osvcShared, socialMinBaseMonthly: 17139, healthMinBaseMonthly: 24483.5, sicknessMonthly: 243 },
  },
  2027: {
    ...shared,
    year: 2027,
    avgWage: 51663,
    minWage: 24900,
    highRateThreshold: 1859868,
    childBonusMinIncome: 149400,
    maxSocialBase: 2479824,
    // Sickness minimum for 2027 not confirmed; 2026 value kept.
    osvc: { ...osvcShared, socialMinBaseMonthly: 18083, healthMinBaseMonthly: 25831.5, sicknessMonthly: 243 },
  },
};
